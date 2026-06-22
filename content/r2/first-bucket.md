---
title: 'Your first R2 bucket'
category: 'R2'
description: 'Create a Worker that uploads and downloads files from an R2 bucket.'
storybook: 'r2'
author: 'tori'
---

The quickest way to see R2 work end to end is to give a Worker one bucket to read and write. Wire up a fetch handler that stores a file on a `PUT` request and reads it back on a `GET`. It's deliberately small so the moving parts (the binding, the bucket, the `put`/`get` calls) stay visible.

### Before you start

You'll need a Cloudflare Workers project. If you don't have one yet, follow the <a href="/labs/workers-intro/first-worker" class="tori-link">Your first Worker</a> Lab first.

::info
This Lab uses the R2 binding API directly from a Worker. For serving files to the public internet without code, you can also attach a public URL or custom domain to a bucket from the Cloudflare dashboard.
::

### Step 1: Create the bucket

Create a bucket called `my-files`. You can do this from the Cloudflare dashboard under **R2 Object Storage**, or with Wrangler from your terminal:

```bash
npx wrangler r2 bucket create my-files
```

Wrangler will confirm the bucket was created. You only do this once per bucket; the name is what you'll reference in the next step.

::warning
Bucket names can only contain lowercase letters, numbers, and hyphens, must be 3-63 characters long, and can't begin or end with a hyphen. Names are unique within your account, so if `my-files` is already taken on your account, pick something else and use that name throughout this Lab.
::

### Step 2: Write the Worker

Open `src/index.ts` and add a fetch handler that routes `PUT` to an upload and `GET` to a download:

```ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    // Strip the leading slash so "/tori.png" becomes the key "tori.png".
    const key = url.pathname.slice(1)

    if (request.method === 'PUT') {
      // Stream the request body straight through; R2 reads it without
      // buffering the whole file into the Worker's memory.
      await env.MY_BUCKET.put(key, request.body, {
        httpMetadata: { contentType: request.headers.get('Content-Type') ?? 'application/octet-stream' }
      })
      return new Response(`Saved ${key}`, { status: 201 })
    }

    if (request.method === 'GET') {
      const object = await env.MY_BUCKET.get(key)

      if (object === null) {
        return new Response('Not found', { status: 404 })
      }

      return new Response(object.body, {
        headers: { 'Content-Type': object.httpMetadata.contentType ?? 'application/octet-stream' }
      })
    }

    return new Response('Method not allowed', { status: 405 })
  },
}
```

`env.MY_BUCKET` is a binding to the R2 bucket. `put` writes bytes under a key, `get` reads them back, and both take the key as their first argument.

### Step 3: Configure `wrangler.jsonc`

Cloudflare won't expose the bucket to your Worker until it's declared as a binding. Open `wrangler.jsonc` and add an `r2_buckets` section:

```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-21",

  "r2_buckets": [
    {
      "binding": "MY_BUCKET",
      "bucket_name": "my-files"
    }
  ]
}
```

**`binding`** is the name you reference in code (`env.MY_BUCKET`).  
**`bucket_name`** is the actual bucket on Cloudflare, the one you created in Step 1.

::info
Unlike Durable Objects, R2 buckets don't need a `migrations` section. The bucket already exists on Cloudflare's side; the binding only names it for your Worker.
::

### Step 4: Add the TypeScript types

If you're using TypeScript, declare an `Env` interface so the compiler knows what `env.MY_BUCKET` is:

```ts
interface Env {
  MY_BUCKET: R2Bucket
}
```

Put it at the top of `src/index.ts` or in a separate `env.d.ts` file.

### Step 5: Run it locally

```bash
npx wrangler dev
```

With the server running, upload a file in a second terminal:

```bash
curl -X PUT --data-binary "Hello, R2!" http://localhost:8787/hello.txt
```

Then read it back:

```bash
curl http://localhost:8787/hello.txt
```

You should see `Hello, R2!` printed back. Stop and restart `wrangler dev` and the file is still there, because it lives in the local R2 simulator's persisted state.

### Step 6: Deploy

```bash
npx wrangler deploy
```

Wrangler uploads your Worker and ships the binding along with it. Once deployed, `PUT` and `GET` requests against your Worker's URL read and write from the real `my-files` bucket on Cloudflare's network.

::warning
If you see a "bucket not found" error at runtime, the `bucket_name` in your config doesn't match a bucket on your account. Run `npx wrangler r2 bucket list` to check the exact name and update `wrangler.jsonc` to match.
::
