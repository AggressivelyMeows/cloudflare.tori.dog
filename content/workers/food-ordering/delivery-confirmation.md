---
title: 'Human-in-the-loop (Part 2): delivery confirmation'
category: 'Workers'
description: 'Pause a Workflow a second time until a driver confirms the order was dropped off.'
storybook: 'food-ordering'
author: 'tori'
---

The kitchen accepted the order and marked it `preparing`. Once the food is ready, a driver picks it up and heads out. The Workflow now has to wait a second time — this time for the driver to confirm they dropped the order off at the customer's door.

This is the second human-in-the-loop step. It uses the exact same pattern as the kitchen step on the previous page: set a status, poll it with `step.sleep`, and let a separate request flip it. The point of showing it twice is that a single Workflow can pause for humans at multiple points, and each pause is independent.

### Mark the order as out for delivery

After the kitchen marks the order `preparing`, the Workflow sets the status to `out_for_delivery` and waits. The driver's request will set it to `delivered` (or `delivery_failed`):

```ts
await step.do('mark out for delivery', async () => {
  await env.DB.prepare(
    "UPDATE orders SET status = 'out_for_delivery', updated_at = ? WHERE id = ?"
  ).bind(Date.now(), orderId).run()
})
```

### Wait for the driver's confirmation

The wait loop is structurally identical to the kitchen's — only the status values and step names change:

```ts
let delivery = 'pending'

for (let attempt = 0; attempt < 1440; attempt++) {
  const result = await step.do(`check delivery ${attempt}`, async () => {
    const row = await env.DB.prepare(
      'SELECT status FROM orders WHERE id = ?'
    ).bind(orderId).first<{ status: string }>()

    return row?.status ?? 'pending'
  })

  if (result === 'delivered' || result === 'delivery_failed') {
    delivery = result
    break
  }

  await step.sleep('wait for delivery', '60 seconds')
}

if (delivery === 'delivery_failed') {
  await step.do('mark delivery failed', async () => {
    await env.DB.prepare(
      "UPDATE orders SET status = 'delivery_failed', updated_at = ? WHERE id = ?"
    ).bind(Date.now(), orderId).run()
  })
  return // End the Workflow. The order was not delivered.
}

// The driver confirmed drop-off. Mark the order delivered.
await step.do('mark delivered', async () => {
  await env.DB.prepare(
    "UPDATE orders SET status = 'delivered', updated_at = ? WHERE id = ?"
  ).bind(Date.now(), orderId).run()
})
```

A `delivery_failed` outcome covers the case where the driver couldn't complete the drop-off (wrong address, customer unavailable). In a real app you'd refund or retry; here the Workflow just ends.

The step names (`check delivery 0`, `wait for delivery`, `check delivery 1`, …) are distinct from the kitchen step's names, so the instance's step list clearly separates the two waits when you're debugging.

:::info
Because each wait is its own set of named steps, you can tell from the dashboard exactly how long the kitchen took versus how long the driver took. That observability is a side benefit of making each check a step rather than a single opaque `sleep`.
:::

### The driver's route

The driver's confirmation comes in through another HTTP route in the same `fetch` handler. The regex matches `deliver` or `fail`:

```ts
// POST /orders/:id/deliver  or  POST /orders/:id/fail
if (request.method === 'POST') {
  const match = url.pathname.match(/^\/orders\/([^/]+)\/(deliver|fail)$/)
  if (match) {
    const orderId = match[1]
    const action = match[2]
    const status = action === 'deliver' ? 'delivered' : 'delivery_failed'

    await env.DB.prepare(
      "UPDATE orders SET status = ?, updated_at = ? WHERE id = ?"
    ).bind(status, Date.now(), orderId).run()

    return new Response(`Order ${orderId} ${status}`, { status: 200 })
  }
}
```

The route is the same shape as the kitchen's: write to D1, return 200, let the Workflow's next poll pick it up.

<mermaid>
sequenceDiagram
    participant D as Driver
    participant W as Worker
    participant DB as D1
    participant WF as Workflow instance

    WF->>DB: status = out_for_delivery
    Note over WF: polling loop starts
    WF->>DB: SELECT status (pending)
    Note over WF: sleep 60s
    D->>W: POST /orders/x/deliver
    W->>DB: status = delivered
    W-->>D: 200 OK
    WF->>DB: SELECT status (delivered)
    Note over WF: exit loop, mark delivered
</mermaid>

:::warning
As with the kitchen route, check the current status before updating it. A driver shouldn't be able to "deliver" an order that was rejected by the kitchen, and a kitchen shouldn't be able to "accept" an order that's already out for delivery. The snippet omits these guards for brevity.
:::

The next page covers [running instances](/labs/workers/food-ordering/running-instances) and observing them as they progress.
