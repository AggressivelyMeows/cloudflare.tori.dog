---
title: 'Ordering with Workflows'
category: 'Workers'
description: 'Coordinate a multi-step food order pipeline that pauses for a human to approve high-value orders.'
storybook: 'food-ordering'
author: 'tori'
---

A food order isn't a single action. A customer submits a basket, the kitchen has to accept it, payment has to be captured, and someone has to decide whether a large order needs a manager's sign-off. Each step can fail on its own, and the whole thing can take minutes from start to finish.

A plain Worker `fetch` handler runs once and returns. Workers have a short execution time and don't persist state between requests, so if the process needs to pause and wait for a human, or survive a crash mid-way through, a single request isn't enough. <a class="tori-glossary-link" href="?glossary=workflows">Workflows</a> give you a place to write that multi-step process as code, where each step is durable and the Workflows runtime (a separate engine from the Worker itself) handles retries and state for you.

### What we're building

A food ordering service with one Workflow instance per order. The Workflow walks through five steps: validate the basket, charge the card, decide whether a human needs to approve it, wait for that approval if required, and mark the order as fulfilled. Orders above a threshold pause for a manager; smaller orders skip straight through.

<mermaid>
flowchart TD
    Start["Customer submits order"] --> S1["validate basket"]
    S1 --> S2["charge card"]
    S2 --> S3{"Order over $100?"}
    S3 -->|Yes| S4["wait for manager approval"]
    S3 -->|No| S5
    S4 --> S5["mark order fulfilled"]
    S5 --> Done["Order complete"]
</mermaid>

The pieces involved:

- A **D1** database stores orders and their status, so the kitchen and the customer can look an order up later.
- A **Workflow** coordinates the steps. Each step returns a value that the next step can read, and the engine persists that value between steps.
- A **Worker** exposes HTTP routes: one to submit an order (which creates a Workflow instance), and one for a manager to approve a paused order.

::info
The human-in-the-loop step is the interesting part. A Workflow can pause indefinitely waiting for external input, and the engine keeps its state safe while it waits. There's no timeout you have to fight, and no cron job polling for a response.
::

### Why a Workflow, not just a Worker?

A Worker handles one request. If that request needs to wait for a manager who might be at lunch, the request would have to stay open for an hour, which the platform won't allow. You could store the order in a database and poll, but then you're building the retry, state, and "where was I?" logic yourself.

A Workflow separates the steps from the requests that trigger them. The `validate` and `charge` steps run immediately. The `wait for approval` step blocks the Workflow (not a request) until a separate request from the manager unblocks it. If the Worker restarts between steps, the engine resumes the Workflow from the last completed step.

### Before you start

You'll need a Cloudflare Workers project. If you don't have one yet, follow the [Your first Worker](/labs/workers-intro/first-worker) Lab first. This storybook assumes you can run `wrangler dev` and edit `wrangler.jsonc`.

The next page sets up the [D1 database](/labs/workers/food-ordering/storing-orders) that holds the orders.
