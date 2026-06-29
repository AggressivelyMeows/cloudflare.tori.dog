---
title: 'Human-in-the-loop (Part 1): kitchen acceptance'
category: 'Workers'
description: 'Pause a Workflow until the kitchen accepts or rejects the order, then resume from a separate request.'
storybook: 'food-ordering'
author: 'tori'
---

The first two steps run back to back in milliseconds. The third step is different: it has to wait for a human. A kitchen staffer sees the order on a screen and clicks accept or reject. That could take seconds or minutes, and the Workflow has to stay paused in the meantime.

This is the first of two human-in-the-loop steps in the order pipeline. The second — waiting for the driver to confirm delivery — is covered on the next page. Both use the same pattern, so this page explains it in full and the next page shows the reuse.

### The pattern: poll a signal

Workflows don't have a built-in "wait for HTTP request" primitive. The pattern is:

1. The Workflow writes a "waiting" status to D1 and then loops, checking the status each time.
2. Between checks, it sleeps with `step.sleep` so it isn't busy-spinning.
3. A separate HTTP request from the kitchen flips the status to `accepted` or `rejected`.
4. The Workflow's next check sees the change and continues.

The status column in D1 is the signal the two sides communicate through. The Workflow never talks to the kitchen's request directly — they share state through the database.

:::info
This is the canonical pattern today; future Workflows features may offer event-based resume, but polling on durable state is what the engine is built for.
:::

### Mark the order as waiting

After the card is charged, the Workflow sets the status to `awaiting_kitchen` so the kitchen's dashboard can list it:

```ts
await step.do('mark awaiting kitchen', async () => {
  await env.DB.prepare(
    "UPDATE orders SET status = 'awaiting_kitchen', updated_at = ? WHERE id = ?"
  ).bind(Date.now(), orderId).run()
})
```

Every order waits for the kitchen — there's no threshold. A kitchen that's slammed can reject an order so the customer is refunded instead of waiting forever.

### Wait for the kitchen's decision

Now the Workflow loops, checking the status once per minute until it changes. Each check is its own `step.do` call, so a crash during the wait resumes from the last check rather than restarting the whole wait:

```ts
let acceptance = 'pending'

for (let attempt = 0; attempt < 1440; attempt++) {
  // Read the current status. This is a single row lookup.
  const result = await step.do(`check kitchen ${attempt}`, async () => {
    const row = await env.DB.prepare(
      'SELECT status FROM orders WHERE id = ?'
    ).bind(orderId).first<{ status: string }>()

    return row?.status ?? 'pending'
  })

  if (result === 'accepted' || result === 'rejected') {
    acceptance = result
    break
  }

  // Not decided yet. Sleep 60 seconds, then loop and check again.
  await step.sleep('wait for kitchen', '60 seconds')
}

if (acceptance === 'rejected') {
  await step.do('mark rejected', async () => {
    await env.DB.prepare(
      "UPDATE orders SET status = 'rejected', updated_at = ? WHERE id = ?"
    ).bind(Date.now(), orderId).run()
  })
  return // End the Workflow. The order is not delivered.
}

// The kitchen accepted. Move to preparing.
await step.do('mark preparing', async () => {
  await env.DB.prepare(
    "UPDATE orders SET status = 'preparing', updated_at = ? WHERE id = ?"
  ).bind(Date.now(), orderId).run()
})
```

A few things to notice:

- **The loop runs up to 1440 times.** At 60 seconds per sleep, that's 24 hours — after which the loop exits and the Workflow throws. Adjust both numbers to fit your business rule.
- **Each check is a named step.** The name includes the attempt number (`check kitchen 0`, `check kitchen 1`, …) so the instance's step list in the dashboard reads as a clear log of how long the kitchen took.
- **`step.sleep` is durable.** The engine wakes the Workflow after the delay without holding a request open. If the Worker restarts mid-sleep, the engine resumes the sleep rather than skipping it.
- **`first<{ status: string }>()`** returns the matching row or `null`. The `row?.status ?? 'pending'` fallback handles a missing row gracefully.

:::info
A shorter sleep means faster response once the kitchen decides, at the cost of more D1 reads. 60 seconds is a reasonable default for a human-paced step.
:::

### The kitchen's route

The kitchen's decision comes in through a separate HTTP route. Add it to the same Worker `fetch` handler that handles `POST /orders`. The route just updates the status in D1 — the Workflow's next poll picks up the change:

```ts
// POST /orders/:id/accept  or  POST /orders/:id/reject
if (request.method === 'POST') {
  const match = url.pathname.match(/^\/orders\/([^/]+)\/(accept|reject)$/)
  if (match) {
    const orderId = match[1]
    const action = match[2]
    const status = action === 'accept' ? 'accepted' : 'rejected'

    await env.DB.prepare(
      "UPDATE orders SET status = ?, updated_at = ? WHERE id = ?"
    ).bind(status, Date.now(), orderId).run()

    return new Response(`Order ${orderId} ${status}`, { status: 200 })
  }
}
```

The route doesn't talk to the Workflow directly. It writes to D1, and the Workflow sees the new status on its next poll. This decoupling is what makes the pattern robust: the kitchen's request can't crash or block the Workflow, and the Workflow can't block the kitchen's request.

<mermaid>
sequenceDiagram
    participant K as Kitchen
    participant W as Worker
    participant DB as D1
    participant WF as Workflow instance

    WF->>DB: status = awaiting_kitchen
    Note over WF: polling loop starts
    WF->>DB: SELECT status (pending)
    Note over WF: sleep 60s
    K->>W: POST /orders/x/accept
    W->>DB: status = accepted
    W-->>K: 200 OK
    WF->>DB: SELECT status (accepted)
    Note over WF: exit loop, mark preparing
</mermaid>

:::warning
The kitchen's route should check the current status before updating it, so accepting an order that's already been delivered or rejected is rejected with a clear error. The snippet above omits that check for brevity; add it before using this in anything real.
:::

The next page covers the [delivery confirmation step](/labs/workers/food-ordering/delivery-confirmation) — the second human-in-the-loop pause, where the Workflow waits for the driver.
