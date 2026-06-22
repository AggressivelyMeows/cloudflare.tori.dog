---
title: 'What are Durable Objects?'
category: 'Durable Objects'
description: 'The mechanics behind Durable Objects: addressing by name, one-at-a-time execution, and how they sit behind a Worker.'
storybook: 'durable-objects'
author: 'tori'
---

The <a href="?glossary=durable-objects" class="tori-glossary-link">Durable Objects glossary entry</a> covers the idea in plain terms. This page goes a level deeper into the three properties you build around: each object has a fixed address, runs your code one request at a time, and is only reachable through a Worker.

### The problem they solve

Imagine a live vote tally. Thousands of people submit a vote at the same time. Each vote has to read the current count, add one, and save it back. If two votes read "10" at the same moment and both write "11", one vote disappears. You've lost a count without ever seeing an error.

A Durable Object is how you stop that from happening. The same pattern shows up in a turn-based game where two players can't move at once, a rate limiter that needs an accurate count, or a chat room where everyone has to see the same messages. In each case, many callers need to reach one shared thing, and that thing has to handle them one at a time.

### Addressed by name

You don't pick where a Durable Object runs. Cloudflare places it in one data center and keeps it there. What you control is its name. The same name always reaches the same object:

```ts
// "poll:mayor" is the name. Every request that uses this string
// reaches the one object counting that poll's votes.
const id = env.POLLS.idFromName('poll:mayor')
const poll = env.POLLS.get(id)
```

Workers running anywhere in the world all reach the same object for `poll:mayor`. Their requests line up at that one object instead of racing against separate copies of the count.

<mermaid>
flowchart TD 
    A["Worker (San Francisco)"] -->|idFromName poll:mayor| DO
    B["Worker (Frankfurt)"] -->|idFromName poll:mayor| DO
    C["Worker (Singapore)"] -->|idFromName poll:mayor| DO

    DO["One Durable Object for poll:mayor"]
</mermaid>

### One request at a time

An object finishes one request before it starts the next. The second vote doesn't begin until the first vote's read and write are both done, so the two can never overwrite each other:

```ts
async fetch(request: Request): Promise<Response> {
  const count = (await this.ctx.storage.get<number>('count')) ?? 0

  // The next request can't start until this write completes,
  // so no two votes ever read the same count.
  await this.ctx.storage.put('count', count + 1)
  return new Response(`Votes: ${count + 1}`)
}
```

You don't need locks, retries, or any coordination logic to get this. The trade-off is speed: one object handles requests one after another, so split your work across many objects (one per poll, one per user) rather than sending everything to a single one.

::info
"One at a time" means one request at a time, not one object total. You can run as many objects as you need, each handling its own line of requests in parallel.
::

### Reached through a Worker

A Durable Object never receives traffic directly from the internet. A Worker takes the incoming request, picks which object it belongs to, and forwards it:

```
Request → Worker → Durable Object → Response
```

One Worker can route to as many objects as you need. The voting Worker might send one request to `poll:mayor` and the next to `poll:council`, each landing on the object that holds that poll's count.

### It remembers

An object keeps its data on disk, separate from its memory. It appears the first time something addresses it by name, stays active while requests keep coming, and goes to sleep when idle. Going to sleep only clears its memory: the vote count on disk is untouched, and the next request wakes it back up.

Storage survives every sleep and restart. It only goes away when you call `this.ctx.storage.deleteAll()`, which is how you clear an object once its poll closes.

### What might you use it for?

The one-at-a-time guarantee is a good fit for any scenario where many callers need to reach one shared thing. A few examples:
- A chat room where everyone has to see the same messages in the same order.
- A turn-based game where two players can't move at once.
- A live counter that needs an accurate count under heavy load.
