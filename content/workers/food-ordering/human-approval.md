---
title: 'Human-in-the-loop approval'
category: 'Workers'
description: 'Pause a Workflow until a manager approves the order, then resume from a separate request.'
storybook: 'food-ordering'
author: 'tori'
---

The first three steps run back to back in milliseconds. The fourth step is different: it has to wait for a human. A manager opens a dashboard, sees the order, and clicks approve. That could take seconds or hours, and the Workflow has to stay paused in the meantime.

Workflows don't have a built-in "wait for HTTP request" primitive. The pattern is to pause on a signal that a separate request sets. The Workflow polls that signal with `step.sleep`, and the manager's request flips it. This is the canonical pattern today; future Workflows features may offer event-based resume, but polling on durable state is what the engine is built for.

### The signal: a row in D1

The order's `status` column is the signal. When the Workflow decides approval is needed (the `decision.needsApproval` value from the previous page's `decide approval` step), it sets the status to `awaiting_approval`. The manager's request sets it to `approved` (or `rejected`). The Workflow's wait step polls the status until it changes:

```ts
if (decision.needsApproval) {
  // Tell the world this order is waiting. The manager's dashboard
  // lists rows with this status.
  await step.do('mark awaiting approval', async () => {
    await env.DB.prepare(
      "UPDATE orders SET status = 'awaiting_approval', updated_at = ? WHERE id = ?"
    ).bind(Date.now(), orderId).run()
    return { waiting: true }
  })

  const approval = await waitForApproval(env, step, orderId)
  if (approval.status === 'rejected') {
    await step.do('mark rejected', async () => {
      await env.DB.prepare(
        "UPDATE orders SET status = 'rejected', updated_at = ? WHERE id = ?"
      ).bind(Date.now(), orderId).run()
      return { rejected: true }
    })
    return // End the Workflow. The order is not fulfilled.
  }
}
```

If the order doesn't need approval, this whole block is skipped and the Workflow goes straight to fulfillment.

### The wait step

`waitForApproval` loops, sleeping between checks. The loop is capped at 1440 attempts — 24 hours of polling at 60 seconds each — so an order that never gets a decision eventually times out. Each iteration is its own step, so a crash during the wait resumes from the last completed check rather than restarting the wait:

```ts
async function waitForApproval(
  env: Env,
  step: WorkflowStep,
  orderId: string
): Promise<{ status: 'approved' | 'rejected' }> {
  for (let attempt = 0; attempt < 1440; attempt++) {
    // The step name includes the attempt number so each check is a
    // distinct entry in the instance's step list. Names don't have to
    // be unique, but unique names make the log readable.
    const result = await step.do(`check approval ${attempt}`, async () => {
      const row = await env.DB.prepare(
        'SELECT status FROM orders WHERE id = ?'
      ).bind(orderId).first<{ status: string }>()

      // `as const` tells TypeScript these are the literal strings
      // 'approved' / 'rejected', not just any string.
      if (row?.status === 'approved') return { status: 'approved' as const }
      if (row?.status === 'rejected') return { status: 'rejected' as const }
      return { status: 'pending' as const }
    })

    if (result.status !== 'pending') {
      return result
    }

    // Sleep 60 seconds before the next check. The duration accepts
    // human-friendly strings like '60 seconds', '1 minute', or '2 hours'.
    await step.sleep('check approval sleep', '60 seconds')
  }

  throw new Error('Approval timed out after 24 hours')
}
```

Each `step.do` call is named with the attempt number, so the instance's step list reads as a clear log: `check approval 0`, `check approval sleep`, `check approval 1`, and so on. The `step.sleep` call is itself a durable step; the engine wakes the Workflow after the delay without holding a request open.

::info
Adjust the limit and the sleep duration to match your business rule. A shorter sleep means faster response once approved, at the cost of more D1 reads.
::

### The manager's route

A separate Worker route handles the manager's decision. Add it to the same Worker's `fetch` handler that handles `POST /orders`. It updates the order's status, and the Workflow's next poll picks up the change:

```ts
// Inside the Worker's fetch handler:
// POST /orders/:id/approve  or  POST /orders/:id/reject
if (request.method === 'POST') {
  const match = url.pathname.match(/^\/orders\/([^/]+)\/(approve|reject)$/)
  if (match) {
    const [, orderId, action] = match
    const status = action === 'approve' ? 'approved' : 'rejected'

    await env.DB.prepare(
      "UPDATE orders SET status = ?, updated_at = ? WHERE id = ?"
    ).bind(status, Date.now(), orderId).run()

    return new Response(`Order ${orderId} ${status}`, { status: 200 })
  }
}
```

The route doesn't talk to the Workflow directly. It writes to D1, and the Workflow's wait step sees the new status on its next poll. This decoupling is what makes the pattern robust: the manager's request can't crash or block the Workflow, and the Workflow can't block the manager's request.

<mermaid>
sequenceDiagram
    participant M as Manager
    participant W as Worker
    participant DB as D1
    participant WF as Workflow instance

    WF->>DB: status = awaiting_approval
    Note over WF: polling loop starts
    WF->>DB: SELECT status (pending)
    Note over WF: sleep 60s
    M->>W: POST /orders/x/approve
    W->>DB: status = approved
    W-->>M: 200 OK
    WF->>DB: SELECT status (approved)
    Note over WF: exit loop, continue
</mermaid>

::warning
The manager's route should check the current status before updating it, so approving an order that's already been fulfilled or rejected is rejected with a clear error. The snippet above omits that check for brevity; add it before using this in anything real.
::

The next page covers [running instances](/labs/workers/food-ordering/running-instances) and observing them as they progress.
