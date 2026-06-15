---
title: 'What are Workers?'
category: 'Workers'
description: "Intro to Cloudflare Workers, the core of Cloudflare's serverless platform."
storybook: 'workers-intro'
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

Workers perform best when designed from the start to be serverless. This means that they should be stateless, and not rely on any local file system or in-memory state. Instead, they can use Cloudflare's other serverless products like <a class="tori-glossary-link" href="?glossary=durable-objects">Durable Objects</a> for stateful applications, or <a class="tori-glossary-link" href="?glossary=r2">R2</a> for object storage.

If your workload requires frequent requests to a backend database, it may be more efficient to use a traditional server. This is because Workers run from anywhere in the world and can have higher latency when making requests to backend services compared to a server that is located close / in the same data center as the services.