---
title: 'Key-Value & You.'
category: 'Storage Primitives'
description: 'The mechanics behind Workers KV: namespaces, keys, and the consistency model that makes reads fast anywhere.'
storybook: 'kv'
author: 'tori'
---

Imagine you want to remember a user's preferred language between requests, or cache the result of an expensive API call so the next visitor doesn't have to wait. You could store that in a database, but for small pieces of data that are read far more often than they're written, a database is overkill. You just want a place to put a value under a name and get it back quickly.

**KV** (Key-Value) is a global, eventually-consistent store that runs on Cloudflare's network. You write a value once under a key, and any Worker can read it back milliseconds later. It's designed for reads: data is cached close to where it's needed.

::info
KV is optimised for **read-heavy** workloads. If you find yourself writing on every request, or needing strong consistency between writes and reads, you probably want <a class="tori-glossary-link" href="?glossary=durable-objects">Durable Objects</a> instead.
::

### Organised into namespaces

A **namespace** is a container for your key-value pairs, like a drawer in a filing cabinet. You might have one namespace for user preferences, another for cached API responses, and a third for feature flags. Namespaces are independent: a key in one can't collide with a key in another.

You connect a namespace to your Worker as a **binding** in `wrangler.jsonc`. From the Worker's perspective, the namespace just appears as a property on `env`:

```ts
// env.PREFERENCES is a binding to a KV namespace.
// The key "theme:42" lives inside that namespace only.
await env.PREFERENCES.put('theme:42', 'dark')
const theme = await env.PREFERENCES.get('theme:42')
```

### Addressed by key

Inside a namespace, every value has a **key**: the string you used to save it. The same key always points at the same value, so two Workers asking for `theme:42` get back the same answer.

Keys are case-sensitive strings and can be almost anything. A common pattern is to use prefixes with a separator, like `user:42:name` or `cache:weather:tokyo`, so you can list keys that share a prefix later.

```ts
// Reads return null if the key doesn't exist, so check before using.
const value = await env.PREFERENCES.get('theme:42')
if (value === null) {
  return new Response('No theme set', { status: 404 })
}
return new Response(value)
```

### Eventually consistent

KV is **eventually consistent**. Once the Promise from `put` resolves, the new value is visible immediately in the region that wrote it, but it takes a short time (usually under 60 seconds) to propagate to every other region.

::warning
Because of eventual consistency, two Workers in different parts of the world might see different values for the same key for a brief window after a write. Don't use KV for anything that needs every reader to agree on the latest value right away; use <a class="tori-glossary-link" href="?glossary=durable-objects">Durable Objects</a> for that.
::

Reads are served from the edge cache closest to the request. Writes go back to a central location and then fan out. KV is built around this trade-off: fast global reads in exchange for a short delay on propagation.

### Values are strings (or bytes)

KV stores values as strings or `ReadableStream`s. If you want to store structured data, serialize it yourself:

```ts
// Write JSON so you can store objects, arrays, numbers, etc.
const user = { name: 'Tori', plan: 'pro', logins: 42 }
await env.PREFERENCES.put('user:42', JSON.stringify(user))

// Read it back and parse.
const raw = await env.PREFERENCES.get('user:42')
const stored = raw ? JSON.parse(raw) : null
```

There's also `get` with a `type` option (`'json'`, `'arrayBuffer'`, `'stream'`) so KV can do the conversion for you:

```ts
const stored = await env.PREFERENCES.get('user:42', { type: 'json' })
```

### What might you use it for?

KV is a good fit for any scenario where you write occasionally and read often, and where a brief delay between a write and a global read is acceptable:

- **Configuration and feature flags** that change rarely but are read on every request.
- **User preferences** like theme, language, or region.
- **Cached results** of expensive API calls or database queries.
- **Lookup tables** like a list of supported countries or pricing tiers.
- **Session data** that doesn't need to be instantly consistent everywhere.

If you need to store large files, use <a class="tori-glossary-link" href="?glossary=r2">R2</a> instead.
