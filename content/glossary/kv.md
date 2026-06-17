---
title: 'KV'
tags: 'workers,storage'
---

**KV** (short for Key-Value) is a simple way to store small pieces of data on Cloudflare and read them back fast, from anywhere in the world.

You save a value under a name (the *key*) and get it back later using that same name. KV spreads your data across Cloudflare's network, so reads are quick no matter where your users are.

> **Think of it as:** a giant notebook where every line has a label and a value. You write it once, then look it up by label whenever you need it.

## The 4 Words You'll See Most

**Key**
The name you give a piece of data. You use this to save it and to look it up later. Keys are just strings, like `"user:42:name"` or `"settings:theme"`.

**Value**
The data itself. It can be a short string, a number, a blob of JSON, or even a file. Whatever you stored under that key, you get back as-is.

**Namespace**
A container for your key-value pairs, like a drawer in a filing cabinet. You might have one namespace for user data and another for cached content. In your `wrangler.jsonc`, you connect a namespace to your Worker as a binding.

**TTL (Time to Live)**
An optional expiry time for a value. Set a TTL and KV will automatically delete that entry after the time runs out. Useful for caches or short-lived tokens.

## A Tiny Example

Here's how you might save and read a value inside a Worker:

```js
export default {
  async fetch(request, env) {
    // save a value
    await env.MY_KV.put("greeting", "Hello, world!");

    // read it back
    const value = await env.MY_KV.get("greeting");

    return new Response(value);
  }
};
```

```json
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-21",
  "kv_namespaces": [
    {
      "binding": "MY_KV",
      "id": "your-namespace-id"
    }
  ]
}
```

`MY_KV` is the binding name you set in `wrangler.jsonc`. The key is `"greeting"`, and the value is the string you stored.

## When Would I Use KV?

- Storing **feature flags** or config your Worker reads on every request
- **Caching** API responses so you don't fetch the same data over and over
- Saving **user preferences** or simple profile data
- Keeping **short-lived tokens** that expire automatically with a TTL
