---
title: 'Add useful extras'
category: 'Workers'
description: 'Polish it up with resizing, caching, and a few things that make it production-worthy.'
storybook: 'avatar-upload'
author: 'tori'
---

At this point you have a working avatar uploader — nice! But there's a gap between "it works on my machine" and "it works for thousands of users." Let's close that gap with a few easy wins.

### Different sizes for different places

Your app probably shows avatars at different sizes — a tiny one in a nav bar, a bigger one on a profile page. Instead of making the browser resize a huge image every time, generate a few variants when the upload happens:

- A small one (64px) for lists and comments
- A medium one (128px) for cards
- A large one (256px) for profile pages

Store them all in R2 under predictable keys like `avatars/{id}/64.webp`. When your frontend needs an avatar, it just asks for the right size.

### Cache the heck out of it

Avatars get loaded *a lot*. Every time someone sees a comment, a message, a profile card — that's an avatar request. Slap a `Cache-Control` header on your responses so Cloudflare's edge caches them:

When someone updates their avatar, change the URL (add a version hash or timestamp) so the old cached version doesn't stick around.

### Clean up after yourself

When someone uploads a new avatar, the old one is just... sitting there, taking up space and costing you money. Delete it! You can do this in the background after the new upload succeeds — the user doesn't need to wait for cleanup to finish.

### Don't let people abuse it

A few simple guardrails go a long way:

- Rate limit uploads (maybe 5 per hour per user?)
- Enforce that size limit we talked about
- Log failed attempts so you can spot patterns

You don't need anything fancy. Just enough to prevent someone from uploading 10,000 images in a loop.

### Little UX touches

Finally, sprinkle in some polish:

- Show a clear error if something goes wrong (not just a blank fail)
- If the upload fails because of a network hiccup, offer a retry button
- Make sure screen readers can understand what's happening too

None of these are hard, but they're the difference between "I built a thing" and "I built a thing people actually enjoy using."
