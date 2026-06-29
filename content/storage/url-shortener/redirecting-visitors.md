---
title: 'Redirecting visitors'
category: 'Storage'
description: 'Look a slug up in D1 and redirect the visitor to the stored URL.'
storybook: 'url-shortener'
author: 'tori'
---

The redirect route is the read side of the shortener. A visitor opens `/:slug`, the Worker looks the slug up in D1, and either redirects or returns a 404.

### The handler

Add a `GET /:slug` branch to the `fetch` handler:

```ts
if (request.method === 'GET' && url.pathname !== '/') {
  // Strip the leading slash so "/tor" becomes "tor".
  const slug = url.pathname.slice(1)

  const link = await env.DB.prepare(
    'SELECT url FROM links WHERE slug = ?'
  ).bind(slug).first<{ url: string }>()

  if (link === null) {
    return new Response('Not found', { status: 404 })
  }

  return Response.redirect(link.url, 302)
}
```

`first` returns the matching row or `null`. `Response.redirect` sends a `302 Found` with the `Location` header set to the stored URL, which the browser follows automatically.

### Why 302

Short links sometimes need to change target, expire, or be retired. A `302` asks the browser to check back on every visit, so edits to a row take effect immediately. A `301` would let the browser skip the Worker entirely on repeat visits, which is faster but makes the link effectively immutable: changing the target later won't reach visitors who saw the `301`.

::info
Use `301` only when you're certain the target will never change. The default `302` keeps you in control.
::

### The full Worker

This is the complete `src/index.ts`, combining everything from the previous page with the redirect branch above:

```ts
interface Env {
  DB: D1Database
}

const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'

function generateSlug(length = 6): string {
  let slug = ''
  for (let i = 0; i < length; i++) {
    slug += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return slug
}

async function createLink(env: Env, longUrl: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateSlug()
    try {
      await env.DB.prepare(
        'INSERT INTO links (slug, url, created_at) VALUES (?, ?, ?)'
      ).bind(slug, longUrl, Date.now()).run()
      return slug
    } catch (error) {
      if (attempt === 4) throw error
    }
  }
  throw new Error('Could not generate a unique slug')
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'POST' && url.pathname === '/') {
      const { url: longUrl } = await request.json<{ url: string }>()

      try {
        new URL(longUrl)
      } catch {
        return new Response('Invalid URL', { status: 400 })
      }

      const existing = await env.DB.prepare(
        'SELECT slug FROM links WHERE url = ?'
      ).bind(longUrl).first<{ slug: string }>()

      if (existing) {
        return Response.json({ slug: existing.slug })
      }

      const slug = await createLink(env, longUrl)
      return Response.json({ slug })
    }

    if (request.method === 'GET' && url.pathname !== '/') {
      const slug = url.pathname.slice(1)

      const link = await env.DB.prepare(
        'SELECT url FROM links WHERE slug = ?'
      ).bind(slug).first<{ url: string }>()

      if (link === null) {
        return new Response('Not found', { status: 404 })
      }

      return Response.redirect(link.url, 302)
    }

    return new Response('Not found', { status: 404 })
  },
}
```

### Try it

Start the dev server and create a link if you haven't already:

```bash
npx wrangler dev
```

```bash
curl -X POST http://localhost:8787/ \
  -H "Content-Type: application/json" \
  -d '{"url":"https://developers.cloudflare.com/d1/"}'
# {"slug":"x7k2qp"}
```

Follow the slug and inspect the redirect:

```bash
curl -v http://localhost:8787/x7k2qp
# < HTTP/1.1 302 Found
# < location: https://developers.cloudflare.com/d1/
```

Open the same URL in a browser and it will follow the redirect to the target.

### Deploy

When the local version works, deploy the Worker and apply the schema remotely:

```bash
npx wrangler d1 execute url-shortener --remote --file=schema.sql
npx wrangler deploy
```

The `--remote` flag runs `schema.sql` against your actual D1 database. `wrangler deploy` publishes the Worker so the shortener is reachable on its `*.workers.dev` URL (or a custom domain if you've set one).

### Where to next?

- Add a `GET /` page with a form so people can create links from a browser instead of `curl`.
- Track click counts with an `UPDATE links SET clicks = clicks + 1` on each redirect (you'll need to add a `clicks` column to the schema first).
- Add an `expires_at` column and filter expired rows out of the redirect query.
