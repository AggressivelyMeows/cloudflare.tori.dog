---
title: 'Steps and state'
category: 'Workers'
description: 'Implement the validate and charge steps, and pass state between them.'
storybook: 'food-ordering'
author: 'tori'
---

The `run` method is a sequence of `step.do` calls. Each step has a name, runs a callback, and returns a value that later steps can read. This page implements the first two steps: validate the basket and charge the card. The next page adds the first human-in-the-loop step, where the kitchen accepts or rejects the order.

### Step 1: validate the basket

The first step checks the order makes sense before any money moves. A total of zero, an empty basket, or a negative price should fail fast:

```ts
async run(event: WorkflowEvent<OrderParams>, step: WorkflowStep) {
  const { orderId, items, total, paymentToken } = event.payload

  const validation = await step.do('validate basket', async () => {
    if (items.length === 0) {
      throw new Error('Basket is empty')
    }

    // Recompute the total from the items rather than trusting the
    // client-supplied value, so a tampered total is caught here.
    const computedTotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )

    if (computedTotal !== total) {
      throw new Error(`Total mismatch: expected ${computedTotal}, got ${total}`)
    }

    return { valid: true, itemCount: items.reduce((n, i) => n + i.quantity, 0) }
  })
}
```

If this step throws, the engine retries it. The validation here is pure logic with no side effects, so a retry is safe. A step that charges a card or sends an email needs more care, covered below. Retries are limited and configurable per step via an options object passed as the second argument: `step.do('name', { retries: { limit: 3, delay: '1 second' } }, async () => ...)`. For steps with side effects, make the callback idempotent so a retry doesn't double-charge or double-send.

### Step 2: charge the card

Charging a card is a side effect, so the callback must be safe to retry. The pattern is to use the `paymentToken` as an idempotency key: the payment provider stores the key alongside the charge, so a second request with the same key returns the original result instead of charging again. That means a retry after a network blip doesn't charge the customer twice.

The endpoint below is a placeholder — in a real app, swap in your payment provider's charge endpoint:

```ts
const charge = await step.do('charge card', async () => {
  // Call payment provider here.
  const response = await fetch('https://api.example-payments.com/charge', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      amount: total,
      token: paymentToken,
      idempotency_key: paymentToken,
    }),
  })

  if (!response.ok) {
    throw new Error(`Payment failed: ${response.status}`)
  }

  const result = await response.json() as { chargeId: string }
  // `as { chargeId: string }` tells TypeScript the shape of the JSON,
  // since fetch can't know it ahead of time.
  return { chargeId: result.chargeId }
})
```

`charge` is now an object `{ chargeId }` that the next step can read. The engine persisted it, so even if the Worker restarts before the kitchen step, the charge ID is still available.

### State flows through return values

Notice that nothing is stored in a global variable. `validation` and `charge` are local variables in `run`, each holding the return value of a step. The engine persists those return values and replays them on resume, so `run` reads as straight-line code even though it's durable:

```ts
async run(event: WorkflowEvent<OrderParams>, step: WorkflowStep) {
  const { orderId, items, total, paymentToken } = event.payload

  const validation = await step.do('validate basket', async () => { /* ... */ })
  const charge = await step.do('charge card', async () => { /* ... */ })

  // Next: wait for the kitchen to accept the order. Covered on the next page.
}
```

The snippets on this page and the next three each show part of `run`; the [running instances](/labs/workers/food-ordering/running-instances) page assembles them into one complete method. For now, read each block as the next piece of the same `run`.

::warning
Don't reach outside the Workflow for state that should live inside it. If you store a step's result in D1 and read it back in a later step, the engine can't replay it on resume, and a crash mid-read could see stale or missing data. Use step return values for anything the Workflow itself needs.
::

The next page covers the [kitchen acceptance step](/labs/workers/food-ordering/human-approval), where the Workflow pauses and waits for the kitchen to accept or reject the order.
