---
title: 'Ordering with Workflows'
category: 'Workers'
description: 'Coordinate a multi-step food order pipeline that pauses for a kitchen to accept the order and a driver to confirm delivery.'
storybook: 'food-ordering'
author: 'tori'
---

A food order isn't a single action. A customer submits a basket, the kitchen has to accept it, payment has to be captured, the food has to be prepared and handed to a driver, and the driver has to confirm they dropped it off. Each step can fail on its own, and the whole thing can take minutes — or hours — from start to finish.

A plain Worker `fetch` handler runs once and returns. Workers have a short execution time and don't persist state between requests, so if the process needs to pause and wait for a human, or survive a crash mid-way through, a single request isn't enough. <a class="tori-glossary-link" href="?glossary=workflows">Workflows</a> give you a place to write that multi-step process as code, where each step is durable and the Workflows runtime (a separate engine from the Worker itself) handles retries and state for you.

### What we're building

A food ordering service with one Workflow instance per order. The Workflow walks through six steps: validate the basket, charge the card, wait for the kitchen to accept or reject the order, mark it as preparing, wait for a driver to confirm delivery, and mark the order as delivered. Two of those steps — kitchen acceptance and delivery confirmation — pause for a human.

<mermaid>
flowchart TD
    Start["Customer submits order"] --> S1["validate basket"]
    S1 --> S2["charge card"]
    S2 --> S3{"Kitchen accepts?"}
    S3 -->|No| Reject["mark rejected"]
    S3 -->|Yes| S4["mark preparing"]
    S4 --> S5["wait for driver to confirm delivery"]
    S5 --> S6["mark delivered"]
    S6 --> Done["Order complete"]
</mermaid>

The pieces involved:

- A **D1** database stores orders and their status, so the kitchen, the driver, and the customer can look an order up later.
- A **Workflow** coordinates the steps. Each step returns a value that the next step can read, and the engine persists that value between steps.
- A **Worker** exposes HTTP routes: one to submit an order (which creates a Workflow instance), one for the kitchen to accept or reject it, and one for the driver to confirm delivery.

::info
The two human-in-the-loop steps are the interesting part. A Workflow can pause indefinitely waiting for external input, and the engine keeps its state safe while it waits. There's no timeout you have to fight, and no cron job polling for a response.
::

### Why a Workflow, not just a Worker?

A Worker handles one request. If that request needs to wait for a kitchen that might be slammed at dinner time, or a driver who's still en route, the request would have to stay open for an hour, which the platform won't allow. You could store the order in a database and poll, but then you're building the retry, state, and "where was I?" logic yourself.

A Workflow separates the steps from the requests that trigger them. The `validate` and `charge` steps run immediately. The `wait for kitchen` and `wait for delivery` steps block the Workflow (not a request) until separate requests from the kitchen and driver unblock them. If the Worker restarts between steps, the engine resumes the Workflow from the last completed step.

### Before you start

You'll need a Cloudflare Workers project. If you don't have one yet, follow the [Your first Worker](/labs/workers-intro/first-worker) Lab first. This storybook assumes you can run `wrangler dev` and edit `wrangler.jsonc`.

The next page sets up the [D1 database](/labs/workers/food-ordering/storing-orders) that holds the orders.
