---
title: 'What are Durable Objects?'
category: 'Durable Objects'
description: 'How Durable Objects work, why they exist in exactly one location, and how they fit into a Workers project.'
storybook: 'durable-objects'
author: 'tori'
---

This Lab assumes you've read the <a href="?glossary=durable-objects" class="tori-glossary-link">Durable Objects glossary entry</a>. It covers the mechanics: why objects live in exactly one place, how that shapes the code you write, and what happens over an object's lifetime.

### One location, always

Every Durable Object instance runs in exactly one Cloudflare data center. When your Worker calls `env.MY_OBJECT.idFromName('some-name')` and then `get(id)`, Cloudflare routes that call to the right location automatically. Two Workers anywhere in the world calling `idFromName('some-name')` reach the same instance, so all reads and writes go through one place, in order.

That guarantee is what makes shared state coherent across Workers. Without it, two requests could update the same value simultaneously and produce inconsistent results.

<mermaid>
flowchart TD 
    A["Worker (San Francisco)"] -->|idFromName| DO
    B["Worker (Frankfurt)"] -->|idFromName| DO
    C["Worker (Singapore)"] -->|idFromName| DO

    subgraph one ["One data center"]
        DO["Durable Object: room-42"]
    end
</mermaid>

### Single-threaded execution

A Durable Object processes one request at a time. That serialisation makes read-modify-write patterns safe without locks or atomic operations:

```ts
async fetch(request: Request): Promise<Response> {
  // Safe: no other request can run until this one finishes
  const count = (await this.ctx.storage.get<number>('count')) ?? 0
  await this.ctx.storage.put('count', count + 1)
  return new Response(`${count + 1}`)
}
```

### Workers and Durable Objects together

A Durable Object is not a standalone server. It only handles requests forwarded by a Worker, which is always the entry point for incoming traffic.

```
Request → Worker → Durable Object → Response
```

The Worker's role is routing: it picks the right object by name and forwards the request. One Worker can talk to many objects, for example one per user, one per room, or one per document.

### Lifecycle

An object is created the first time it is accessed by name. Cloudflare loads it into memory and keeps it there while requests keep arriving. When it goes idle, the object may be evicted, but its storage is unaffected. The next request reloads it from that stored state.

There is no explicit create or destroy step. Storage persists until you call `this.ctx.storage.deleteAll()` or remove the object through the API.
