---
title: 'Durable Objects'
tags: 'workers,stateful'
---

A **Durable Object** is a little piece of code on Cloudflare that *remembers things*.

Normally, code on Cloudflare forgets everything after it runs. A Durable Object is special because it keeps its data and stays in one place, so it's great for things like a chat room, a live counter, or a multiplayer game where everyone needs to see the same thing.

> **Think of it as:** one small, smart box that holds some data and lives on the internet. You give it a name, and it's always there when you need it.

## The 4 Words You'll See Most

**Worker**
The regular Cloudflare code that runs your app. Durable Objects are a feature you use *inside* a Worker.

**Instance**
One single Durable Object. If you make a chat app, "Room 42" would be one instance, and "Room 99" would be another.

**Name / ID**
How you find your object. Use the same name and you always get the same object back.

**Storage**
The memory inside each object. This is what lets it *remember* data between visits.

## A Tiny Example

This object counts how many times it's been visited:

```js
export class Counter {
  async fetch(request) {
    // get the saved number (or start at 0)
    let count = (await this.state.storage.get("count")) || 0;

    count = count + 1;

    // save the new number
    await this.state.storage.put("count", count);

    return new Response("Visits: " + count);
  }
}
```

Every time someone visits, the number goes up—and it's *remembered* even after the visit ends. A normal Worker couldn't do that on its own.

```json
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2026-06-01",
  "durable_objects": {
    "bindings": [
      {
        // The name you use in your code to reach this object
        "name": "COUNTER",
        // The class you've exported in your main file
        "class_name": "Counter"
      }
    ]
  }
}
```

## When Would I Use One?

- A **chat room** where everyone sees the same messages
- A **live counter** or vote tally
- A **multiplayer game** that tracks the score
- Anywhere you need **one shared source of truth**