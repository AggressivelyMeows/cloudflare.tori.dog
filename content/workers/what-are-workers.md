---
title: 'What are Workers?'
category: 'Workers'
description: "Intro to Cloudflare Workers, the core of Cloudflare's serverless platform."
storybook: 'workers-intro'
author: 'tori'
---

A Worker is a small JavaScript, Rust, or Python program that runs on Cloudflare's network when a request comes in.

Instead of setting up and managing your own server, you write the logic you want and Cloudflare runs it for you.
This allows you to focus on writing your own code, while Cloudflare takes care of scaling, security, and performance.

```ts
// In 4 lines of code, you have a Worker.
export default {
  async fetch(request: Request) {
    return new Response('Hello, world!')
  }
}
```

### How do Workers work?

When a request comes in, Cloudflare routes it to the nearest data center and runs your Worker code there. This means that your code runs close to your users, resulting in faster response times and improved performance.

We'll get into the technical details of how cool Workers are in later Labs, but for now, Workers are like tiny apps that run on Cloudflare's network. They can do anything from modifying requests and responses, to handling API calls, to running complex logic. The possibilities are endless!

### When to use Workers vs a traditional server?

Workers work best when designed from the start to be serverless. This means that they should be stateless, and not rely on any local file system or in-memory state. Instead, they can use Cloudflare's other serverless products like <a class="tori-glossary-link" href="?glossary=durable-objects">Durable Objects</a> for stateful applications, or <a class="tori-glossary-link" href="?glossary=r2">R2</a> for object storage.

::info
If your workload requires multiple requests to a single backend service like a database, it might be quicker to run your workload on a traditional server. This is because Workers can run anywhere in the world and may not always be close to your database, leading to higher latency.
<br/><br/>
You can offset this by using a globally distributed database, or by sending requests concurrently. Another solution is to use <a class="tori-glossary-link" href="?glossary=smart-placements">Smart Placements</a>, which runs the Worker in a data center closest to your backend services.
::

### What can you build with Workers?

Because Workers run on every request, they can power all kinds of projects. Here are a few common ones:

- **APIs**: Build a backend for your app or website without managing a server.
- **Full websites**: Serve entire sites, including frontends built with frameworks like React or Next.js.
- **Request handling**: Redirect, rewrite, or modify requests and responses as they come in.
- **Automation**: Run scheduled tasks, send notifications, or connect different services together.

You can start with a few lines of code and grow from there. Cloudflare scales it for you automatically.