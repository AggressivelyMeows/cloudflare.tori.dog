---
title: 'Running and observing instances'
category: 'Workers'
description: 'Create a Workflow instance from a request, and inspect its progress with the status API.'
storybook: 'food-ordering'
author: 'tori'
---

The Workflow class is defined, but nothing runs until a request creates an instance. This page adds the submit route that starts an order, and shows how to observe an instance as it moves through its steps.

### The submit route

A customer posts their basket to `POST /orders`. The Worker builds the `OrderParams`, inserts a row in D1, and creates a Workflow instance:

```ts
// Inside the Worker's fetch handler:
if (request.method === 'POST' && url.pathname === '/orders') {
  const body = await request.json<{
    items: OrderItem[]
    paymentToken: string
  }>()

  const orderId = generateId()
  const total = body.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // Persist the order before starting the Workflow, so the row exists
  // when the Workflow's first step reads or updates it.
  await env.DB.prepare(
    'INSERT INTO orders (id, items, total, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(
    orderId,
    JSON.stringify(body.items),
    total,
    'pending',
    Date.now(),
    Date.now()
  ).run()

  // Create the Workflow instance. The params are captured durably
  // with the instance; later changes to the row don't affect the run.
  const instance = await env.ORDER_FLOW.create({
    id: orderId,
    params: {
      orderId,
      items: body.items,
      total,
      paymentToken: body.paymentToken,
    },
  })

  return Response.json({ orderId, status: 'pending' })
}
```

The `id` passed to `create` becomes the instance ID. Using the order ID here means the instance and the order share an identifier, which makes looking one up from the other trivial. If you omit `id`, the engine generates a random one — useful when you don't have a natural key, but here the order ID is the natural choice.

::info
`create()` returns immediately. The Workflow runs asynchronously; the customer's request doesn't wait for it to finish. The response just confirms the order was accepted and the process started.
::

### The full run method

This is the complete `run` method, combining the steps from the previous three pages into one. Note the `const env = this.env` line: `WorkflowEntrypoint` exposes your `Env` bindings as `this.env` inside the class, so steps that need D1 reach it through `this.env.DB`. (The earlier snippets wrote `env` directly for brevity; in the real file it comes from `this.env`.)

```ts
async run(event: WorkflowEvent<OrderParams>, step: WorkflowStep) {
  const { orderId, items, total, paymentToken } = event.payload
  const env = this.env

  const validation = await step.do('validate basket', async () => {
    if (items.length === 0) throw new Error('Basket is empty')
    const computedTotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
    if (computedTotal !== total) throw new Error('Total mismatch')
    return { valid: true }
  })

  const charge = await step.do('charge card', async () => {
    // Call payment provider here.
    const response = await fetch('https://api.example-payments.com/charge', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ amount: total, token: paymentToken, idempotency_key: paymentToken }),
    })
    if (!response.ok) throw new Error(`Payment failed: ${response.status}`)
    const result = await response.json() as { chargeId: string }
    return { chargeId: result.chargeId }
  })

  // First human-in-the-loop: wait for the kitchen.
  await step.do('mark awaiting kitchen', async () => {
    await env.DB.prepare(
      "UPDATE orders SET status = 'awaiting_kitchen', updated_at = ? WHERE id = ?"
    ).bind(Date.now(), orderId).run()
  })

  let acceptance = 'pending'
  for (let attempt = 0; attempt < 1440; attempt++) {
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
    await step.sleep('wait for kitchen', '60 seconds')
  }

  if (acceptance === 'rejected') {
    await step.do('mark rejected', async () => {
      await env.DB.prepare(
        "UPDATE orders SET status = 'rejected', updated_at = ? WHERE id = ?"
      ).bind(Date.now(), orderId).run()
    })
    return
  }

  await step.do('mark preparing', async () => {
    await env.DB.prepare(
      "UPDATE orders SET status = 'preparing', updated_at = ? WHERE id = ?"
    ).bind(Date.now(), orderId).run()
  })

  // Second human-in-the-loop: wait for the driver.
  await step.do('mark out for delivery', async () => {
    await env.DB.prepare(
      "UPDATE orders SET status = 'out_for_delivery', updated_at = ? WHERE id = ?"
    ).bind(Date.now(), orderId).run()
  })

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
    return
  }

  await step.do('mark delivered', async () => {
    await env.DB.prepare(
      "UPDATE orders SET status = 'delivered', updated_at = ? WHERE id = ?"
    ).bind(Date.now(), orderId).run()
  })
}
```

### Observing an instance

Each instance has a status you can query. The `instance` object returned by `create()` has an `id`; use it to fetch the current status:

```ts
// GET /orders/:id/status
if (request.method === 'GET') {
  const match = url.pathname.match(/^\/orders\/([^/]+)\/status$/)
  if (match) {
    const [, orderId] = match
    const instance = await env.ORDER_FLOW.get(orderId)
    const result = await instance.status()

    return Response.json({
      orderId,
      status: result.status,          // 'running' | 'complete' | 'errored'
      output: result.output,          // the final return value, if complete
    })
  }
}
```

The object returned by `status()` includes the current state (`running`, `complete`, or `errored`) and, when finished, the output. For a deeper view, the Cloudflare dashboard shows each step by name, whether it succeeded, and how long it took.

::info
The step names you pass to `step.do` are what show up in the dashboard. Descriptive names like `validate basket` and `check kitchen 3` make a running instance readable at a glance. Avoid generic names like `step1`.
::

### Try it

Start the dev server:

```bash
npx wrangler dev
```

Submit an order:

```bash
curl -X POST http://localhost:8787/orders \
  -H "Content-Type: application/json" \
  -d '{"items":[{"name":"coffee","price":350,"quantity":2}],"paymentToken":"tok_test"}'
# {"orderId":"x7k2qp9m","status":"pending"}
```

Check its status — it will be `running`, waiting for the kitchen:

```bash
curl http://localhost:8787/orders/x7k2qp9m/status
# {"orderId":"x7k2qp9m","status":"running","output":null}
```

Accept it as the kitchen:

```bash
curl -X POST http://localhost:8787/orders/x7k2qp9m/accept
# Order x7k2qp9m accepted
```

Within a minute (the poll interval), the Workflow moves to `preparing` and then `out_for_delivery`, waiting for the driver. Confirm delivery:

```bash
curl -X POST http://localhost:8787/orders/x7k2qp9m/deliver
# Order x7k2qp9m delivered
```

The order becomes `complete`:

```bash
curl http://localhost:8787/orders/x7k2qp9m/status
# {"orderId":"x7k2qp9m","status":"complete","output":null}
```

To see the rejection path, submit another order and `reject` it instead of `accept` — the Workflow ends without reaching delivery.

### Deploy

When the local version works, apply the schema remotely and deploy:

```bash
npx wrangler d1 execute food-orders --remote --file=schema.sql
npx wrangler deploy
```

### Where to next?

- Add a `GET /orders` route that lists orders by status, so the kitchen and driver have dashboards.
- Add a "ready for pickup" step between `preparing` and `out_for_delivery`, so the driver only sees orders that are actually ready.
- Add a step that sends the customer an email when the order is delivered, using an email binding or a third-party API.
