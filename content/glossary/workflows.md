---
title: 'Workflows'
tags: 'workers,storage'
---

**Workflows** are a way to coordinate multiple steps that together make up a longer-running task on Cloudflare. Each step runs on the Workers runtime, and the Workflow engine handles retries, state, and durability between them.

> **Think of it as:** a script that can pause for hours or days, survive crashes, and pick up exactly where it left off, without you building the persistence layer.

## The 4 Words You'll See Most

**Step**
A single unit of work inside a Workflow. Each step is a method decorated with `@Step`, and the engine calls it in the order you define. Steps are the unit of retry: if one throws, only that step runs again.

**State**
The data a Workflow keeps between steps. Anything you `return` from a step is stored durably and available to later steps. You don't manage a database for this yourself; the engine does it.

**Instance**
A single run of a Workflow, created with `create()`. Each instance has its own state and progresses independently. A food ordering Workflow might have one instance per order.

**Binding**
The connection from your Worker to a Workflow, declared in `wrangler.jsonc`. If your binding is `ORDER_FLOW`, you create instances with `env.ORDER_FLOW.create()`.

## A Tiny Example

Here's a Workflow with two steps, where the second uses the result of the first:

```ts
import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers'

export class MyFlow extends WorkflowEntrypoint {
  async run(event: WorkflowEvent, step: WorkflowStep) {
    const result = await step.do('first step', async () => {
      return { value: 42 }
    })

    await step.do('second step', async () => {
      // `result` was persisted by the engine after the first step.
      console.log(result.value)
    })
  }
}
```

```json
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-01",
  "workflows": [
    { "name": "MY_FLOW", "class_name": "MyFlow" }
  ]
}
```

`MyFlow` extends `WorkflowEntrypoint`. The `run` method is the body of the Workflow; the engine calls it once per instance and walks through the `step` calls in order.

## When Would I Use Workflows?

Workflows fit when a task has multiple steps that need to survive failures, wait for external input, or run over a long period. Examples: processing a payment that waits for a webhook, an onboarding flow that emails a user and waits for them to click, or an order pipeline that pauses for a human to approve a refund.

For a single quick operation, a plain Worker `fetch` handler is simpler. For real-time coordination between connected clients, <a class="tori-glossary-link" href="?glossary=durable-objects">Durable Objects</a> are a better fit.
