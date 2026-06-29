---
title: 'Creating short links'
category: 'Storage'
description: 'Generate a slug for a long URL and store it in D1.'
storybook: 'url-shortener'
author: 'tori'
---

The create route takes a JSON body with a `url`, generates a slug, and inserts a row. If the URL already has a slug, return the existing one instead of making a duplicate.

### The handler

The handler does three things in order: read the URL from the request body, check whether it's already been shortened, and if not, generate a slug and insert it. Add a `POST /` branch to the Worker's `fetch` handler:

```ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'POST' && url.pathname === '/') {
      // `request.json<T>()` parses the body as JSON and asserts its shape.
      // Rename `url` to `longUrl` so it doesn't shadow the `url` from `new URL()` above.
      const { url: longUrl } = await request.json<{ url: string }>()

      // Reject anything that isn't a real URL. D1 can't validate this for us.
      try {
        new URL(longUrl)
      } catch {
        return new Response('Invalid URL', { status: 400 })
      }

      // Reuse an existing slug for this URL so we don't fill the table
      // with duplicates of the same link.
      const existing = await env.DB.prepare(
        'SELECT slug FROM links WHERE url = ?'
      ).bind(longUrl).first<{ slug: string }>()

      if (existing) {
        return Response.json({ slug: existing.slug })
      }

      const slug = generateSlug()
      await env.DB.prepare(
        'INSERT INTO links (slug, url, created_at) VALUES (?, ?, ?)'
      ).bind(slug, longUrl, Date.now()).run()

      return Response.json({ slug })
    }

    return new Response('Not found', { status: 404 })
  },
}
```

`prepare` returns a statement. `bind` fills in the `?` placeholders in order, which keeps SQL injection out of the picture. `first` returns a single row (or `null`), and `run` executes a statement that doesn't need results.

::info
The `?` placeholders aren't optional. Building SQL by concatenating strings lets a malicious URL become part of the query. `bind` escapes values for you.
::

### Generating a slug

The slug needs to be short, URL-safe, and unlikely to collide with an existing one. A few random characters from an alphabet of unambiguous symbols is enough for a tutorial:

```ts
// Omit characters that look alike in some fonts (0/O, 1/l/I) so a
// slug read off a printed page still resolves.
const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'

function generateSlug(length = 6): string {
  let slug = ''
  for (let i = 0; i < length; i++) {
    slug += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return slug
}
```

Six characters from a 31-symbol alphabet gives roughly 887 billion combinations. Collisions are rare enough for a demo, but not impossible.

::warning
`Math.random` is not cryptographically secure. For a production shortener, use `crypto.getRandomValues` and handle the rare collision by retrying with a new slug.
::

### Handling collisions

The `slug` column is the primary key, so a duplicate insert throws. Catch it and retry. Swap the inline insert in your handler for a call to `createLink`:

```ts
async function createLink(env: Env, longUrl: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateSlug()
    try {
      await env.DB.prepare(
        'INSERT INTO links (slug, url, created_at) VALUES (?, ?, ?)'
      ).bind(slug, longUrl, Date.now()).run()
      return slug
    } catch (error) {
      // A primary key violation means the slug exists. Try again.
      // This also retries on transient errors like a network blip; for a
      // production app, inspect the error before deciding to retry.
      if (attempt === 4) throw error
    }
  }
  throw new Error('Could not generate a unique slug')
}
```

The loop gives up after five attempts. In practice the first try almost always succeeds; the retry exists for the rare collision. With `createLink` in place, the handler's insert block becomes a single line: `const slug = await createLink(env, longUrl)`.

### Try it

Start the dev server:

```bash
npx wrangler dev
```

Create a link:

```bash
curl -X POST http://localhost:8787/ \
  -H "Content-Type: application/json" \
  -d '{"url":"https://developers.cloudflare.com/d1/"}'
# {"slug":"x7k2qp"}
```

Create the same link again and confirm the slug is reused:

```bash
curl -X POST http://localhost:8787/ \
  -H "Content-Type: application/json" \
  -d '{"url":"https://developers.cloudflare.com/d1/"}'
# {"slug":"x7k2qp"}
```

The next page covers [redirecting visitors](/labs/storage/url-shortener/redirecting-visitors) when someone follows a slug.
