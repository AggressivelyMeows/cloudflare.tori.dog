---
title: 'Your first KV namespace'
category: 'Storage'
description: 'Create a Worker that stores and reads values from a KV namespace.'
storybook: 'kv'
author: 'tori'
---

The quickest way to see KV in action is to give a Worker one namespace to read and write. Wire up a fetch handler that saves a value on a `PUT` request and reads it back on a `GET`. It's deliberately small so the moving parts (the binding, the namespace, the `put`/`get` calls) stay visible.

### Before you start

You'll need a Cloudflare Workers project. If you don't have one yet, follow the <a href="/labs/workers-intro/first-worker" class="tori-link">Your first Worker</a> Lab first.

::info
This Lab uses the KV binding API directly from a Worker. You can also manage namespaces from the Cloudflare dashboard under **Workers & Pages → KV**, but Wrangler is faster for development.
::

### Step 1: Create the namespace

Create a namespace called `my-kv`. You can do this from the Cloudflare dashboard, or with Wrangler from your terminal:

```bash
npx wrangler kv namespace create my-kv
```

Wrangler will respond with something like:

```
 ⛅️ wrangler
 id: 1234567890abcdef1234567890abcdef
```

Copy that `id`; you'll need it in Step 3. You only do this once per namespace; the binding is what lets your Worker reach it.

::warning
Namespace names can only contain letters, numbers, underscores, and hyphens. The `id` is what Cloudflare uses to find your namespace, so keep it safe. If you lose it, you can list your namespaces with `npx wrangler kv namespace list`.
::

### Step 2: Write the Worker

Open `src/index.ts` and add a fetch handler that routes `PUT` to a write and `GET` to a read:

```ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    // Strip the leading slash so "/theme" becomes the key "theme".
    const key = url.pathname.slice(1)

    if (request.method === 'PUT') {
      // Read the body as text and store it under the key.
      const value = await request.text()
      await env.MY_KV.put(key, value)
      return new Response(`Saved ${key}`, { status: 201 })
    }

    if (request.method === 'GET') {
      const value = await env.MY_KV.get(key)

      if (value === null) {
        return new Response('Not found', { status: 404 })
      }

      return new Response(value)
    }

    return new Response('Method not allowed', { status: 405 })
  },
}
```

`env.MY_KV` is a binding to the KV namespace. `put` writes a value under a key, `get` reads it back, and both take the key as their first argument. `get` returns `null` if the key doesn't exist, so always check before using the value.

### Step 3: Configure `wrangler.jsonc`

Cloudflare won't expose the namespace to your Worker until it's declared as a binding. Open `wrangler.jsonc` and add a `kv_namespaces` section:

```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-21",
  "kv_namespaces": [
    {
      "binding": "MY_KV",
      "id": "1234567890abcdef1234567890abcdef"
    }
  ]
}
```

The `binding` is the name your Worker uses to reach the namespace (`env.MY_KV`). The `id` is the value Wrangler printed in Step 1.

::info
For local development, Wrangler creates a local KV store automatically. You can also pass a `preview_id` if you want a separate namespace for development. See the <a href="/labs/wrangler/configuration" class="tori-link">Wrangler Configuration</a> Lab for more on bindings.
::

### Step 4: Run it locally

Start the dev server:

```bash
npx wrangler dev
```

Then in another terminal, write a value:

```bash
curl -X PUT http://localhost:8787/theme -d "dark"
# Saved theme
```

And read it back:

```bash
curl http://localhost:8787/theme
# dark
```

Try a key you haven't set yet:

```bash
curl http://localhost:8787/language
# Not found
```

### Step 5: Add a TTL (optional)

Some values shouldn't live forever. A cache entry, a session token, or a one-time code should expire on its own. Pass a `expirationTtl` (in seconds) to `put` and KV will delete the key after that time:

```ts
// Expires 60 seconds after the write.
await env.MY_KV.put('code:42', '123456', { expirationTtl: 60 })
```

::warning
`expirationTtl` is a minimum of 60 seconds. Shorter values are rounded up. If you need something to expire sooner than that, store the expiry time in the value and check it on read.
::

### Where to next?

- Store JSON to keep structured data per user, like `user:42` → `{ "theme": "dark", "plan": "pro" }`.
- Use `list` to find every key with a prefix, like every `cache:weather:*` key.
- Combine KV with a <a class="tori-glossary-link" href="?glossary=durable-objects">Durable Object</a> when you need strong consistency for a specific key.

For larger files, the <a href="/labs/r2/what-is-r2" class="tori-link">R2</a> storybook covers object storage.
