---
title: 'Your first Worker with Durable Objects'
category: 'Durable Objects'
description: 'Create a Worker that uses a Durable Object to keep a persistent counter.'
storybook: 'durable-objects'
author: 'tori'
---

The quickest way to see a Durable Object work end to end is to give it one number to look after. Wire up a Worker that forwards every request to a single object, and that object will increment and persist a running total. It's deliberately small so the moving parts (the binding, the migration, the storage call) stay visible.

The request path:

<mermaid>
flowchart LR
    Req["Incoming request"] --> W["Worker (fetch handler)"]
    W -->|idFromName| DO["Durable Object: global-counter"]
    DO --> S[("Storage: count")]
    DO --> Resp["Response: Visits: N"]
</mermaid>

### Before you start

You'll need a Cloudflare Workers project. If you don't have one yet, follow the [Your first Worker](/labs/workers-intro/first-worker) Lab first.

::info
This Lab uses the key-value storage API to keep the count on disk. For more complex data, the <a class="tori-link" href="/labs/durable-objects/storage-and-state#querying-with-sql">SQLite API</a> may be a better fit. Both are available inside Durable Objects.
::

### Step 1: Write the Durable Object class

Open `src/index.ts` and add a class called `Counter`:

```ts
import { DurableObject } from 'cloudflare:workers'

export class Counter extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    // Default to 0 on the first request, when no count exists yet.
    const count = ((await this.ctx.storage.get<number>('count')) ?? 0) + 1

    await this.ctx.storage.put('count', count)

    return new Response(`Visits: ${count}`)
  }
}
```

A Durable Object class extends `DurableObject` and handles requests through a `fetch` method. Reads and writes go through `this.ctx.storage`, the per-object store described in the <a href="?glossary=durable-objects" class="tori-glossary-link">Durable Objects glossary entry</a>.

### Step 2: Update the Worker's fetch handler

Update (or add) the default export below the class.

```ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // A fixed name keeps every request pointed at one shared counter.
    const id = env.COUNTER.idFromName('global-counter')
    const counter = env.COUNTER.get(id)

    return counter.fetch(request)
  },
}
```

`env.COUNTER` is a binding to the Durable Object namespace. Passing the same string to `idFromName` always resolves to the same instance, so concurrent requests land on one object instead of spawning new ones.

### Step 3: Configure `wrangler.jsonc`

Cloudflare won't recognise the class until it's declared in `wrangler.jsonc`. Open the file and add two sections:

```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-01",

  "durable_objects": {
    "bindings": [
      {
        "name": "COUNTER",
        "class_name": "Counter"
      }
    ]
  },

  // Without a migration, Cloudflare won't provision storage for the class
  "migrations": [
    {
      "tag": "v1",
      "new_classes": ["Counter"]
    }
  ]
}
```

**`name`** is the binding you reference in code (`env.COUNTER`).  
**`class_name`** is the exported class in your Worker file.  
**`migrations`** provision storage for the class. Every new class needs one migration entry the first time it's deployed.

::info
Migrations are only needed at deploy time. For local development with `wrangler dev`, Cloudflare handles this automatically.
::

### Step 4: Add the TypeScript types

If you're using TypeScript, declare an `Env` interface so the compiler knows what `env.COUNTER` is:

```ts
interface Env {
  COUNTER: DurableObjectNamespace
}
```

Put it at the top of `src/index.ts` or in a separate `env.d.ts` file.

### Step 5: Run it locally

```bash
npx wrangler dev
```

Open `http://localhost:8787` in your browser. Each refresh increments the number. Stop and restart `wrangler dev` and the number persists, because the count lives on disk.

### Step 6: Deploy

```bash
npx wrangler deploy
```

Wrangler applies the migration, uploads your Worker, and registers the Durable Object class.

::warning
If you omit the `migrations` section, Wrangler will deploy your code but the Durable Object storage won't be initialised. You'll see a runtime error the first time the object is accessed. Add the migration and redeploy to fix it.
::
