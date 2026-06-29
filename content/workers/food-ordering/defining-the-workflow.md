---
title: 'Defining the Workflow'
category: 'Workers'
description: 'Create a Workflow class, wire it up as a binding, and understand its run method.'
storybook: 'food-ordering'
author: 'tori'
---

A Workflow is a class that extends `WorkflowEntrypoint`. Its `run` method is the body of the process: the engine calls it once per instance and walks through the `step` calls in order. This page sets up the class and its binding. The next page fills in the steps.

### Add the binding

A Workflow has to be declared in `wrangler.jsonc` before the Worker can create instances of it. Add a `workflows` section alongside the `d1_databases` section from the previous page:

```jsonc
{
  "name": "food-orders",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-01",

  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "food-orders",
      "database_id": "your-database-id"
    }
  ],

  "workflows": [
    { "name": "ORDER_FLOW", "class_name": "OrderWorkflow" }
  ]
}
```

The `name` is the binding you reference in code (`env.ORDER_FLOW`). The `class_name` is the exported class in your Worker file.

### Update the Env type

Add the Workflow binding to the `Env` interface:

```ts
interface Env {
  DB: D1Database
  ORDER_FLOW: Workflow
}
```

`Workflow` is a global type provided by `@cloudflare/workers-types`, so no import is needed. It represents the binding you call `create()` on.

### The class skeleton

A Workflow class imports `WorkflowEntrypoint`, `WorkflowEvent`, and `WorkflowStep` from `cloudflare:workers` — a built-in module provided by the runtime, not something you install from npm. The `run` method takes an event (carrying the input passed to `create()`, readable as `event.payload`) and a `step` object you call to define steps:

```ts
import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers'

export class OrderWorkflow extends WorkflowEntrypoint<Env, OrderParams> {
  async run(event: WorkflowEvent<OrderParams>, step: WorkflowStep) {
    // Steps go here. Each step is a named, retryable unit of work.
  }
}
```

The two type parameters on `WorkflowEntrypoint` are the `Env` interface (so `this.env` is typed) and the shape of the input the Workflow expects (so `event.payload` is typed). Defining the input as a type lets TypeScript check what you pass to `create()` and what you read off `event.payload`.

### The input shape

An order Workflow needs to know what was ordered and how much to charge. Define that as a type:

```ts
interface OrderItem {
  name: string
  price: number      // cents
  quantity: number
}

interface OrderParams {
  orderId: string
  items: OrderItem[]
  total: number      // cents
  paymentToken: string
}
```

The Worker that handles the customer's request will build this object and pass it to `env.ORDER_FLOW.create()`. The Workflow reads it off `event.payload`.

::info
The input is captured at the moment `create()` is called and stored durably with the instance. If the customer changes their basket afterwards, the running instance still sees the original order. This is intentional: an order is a snapshot, not a live view.
::

### How the engine calls run

The engine calls `run` once when the instance is created. As `run` hits each `step.do(...)` call, the engine runs the step's callback, stores the return value, and moves on. If a step throws, only that step is retried — retries are limited and configurable per step, and a step that exhausts its retries marks the whole instance as `errored`. If the Worker restarts mid-Workflow, the engine resumes `run` and replays the stored step results instead of re-running them.

<mermaid>
sequenceDiagram
    participant W as Worker
    participant E as Workflow Engine
    participant S as Step callbacks

    W->>E: create(params)
    E->>E: store instance + input
    E->>S: run step 1 (validate)
    S-->>E: return result
    E->>E: persist result
    E->>S: run step 2 (charge)
    S-->>E: return result
    E->>E: persist result
    Note over E: If the Worker crashes here,<br/>the engine resumes from step 3
    E->>S: run step 3 (decide)
    S-->>E: return result
</mermaid>

Next, we'll cover managing state between steps and defining the steps themselves.