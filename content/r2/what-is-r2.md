---
title: 'What is R2?'
category: 'R2'
description: 'The mechanics behind R2: buckets and objects, how a Worker reaches them, and the consistency model.'
storybook: 'r2'
author: 'tori'
---

Imagine you run a site that lets people upload profile pictures. You need somewhere to put those files, and that somewhere has to outlive any single request. Running your own storage server means provisioning disks, handling failures, and paying for bandwidth every time someone views a picture. Most cloud storage services charge for that bandwidth, and on a busy site it adds up faster than the storage itself.

R2 is object storage that runs on Cloudflare's network. You write a file once under a name, and read it back by that same name whenever you need it, without managing any storage infrastructure. The part that usually hurts, the bandwidth, is free. The same pattern shows up for large downloads, backups, and any case where many callers need to read the same blob of bytes.

::warning
As of right now, Cloudflare forbids using R2 to serve video. Cloudflare has dedicated video hosting products that are a better fit for that use case, so if you want to serve video at scale, check out <a href="https://www.cloudflare.com/products/stream/" class="tori-link">Cloudflare Stream</a>.
::

### Organised into buckets

A bucket is a named container for files, and you decide what each one is for. A photo app might have one bucket for originals and another for thumbnails; a backup tool might have one bucket per customer.

```ts
// The bucket name scopes the key, so "tori.png" here can't
// collide with a "tori.png" in another bucket.
await env.PICTURES.put('tori.png', imageBytes)
```

Buckets are flat namespaces. There are no real folders inside one, but you can put `/` characters in a key to fake them (`2026/summer/beach.jpg` reads as a path even though R2 sees one string). Pick a layout that makes your keys easy to scan and prefix-filter.

### Addressed by key

Inside a bucket, every object has a **key**: the name you gave it when you uploaded it. The same key always points at the same object, so two Workers asking for `tori.png` get back the same bytes:

```ts
// Keys are immutable, so callers can cache the mapping from
// key to object without worrying about it shifting underneath them.
const object = await env.PICTURES.get('tori.png')

if (object === null) {
  return new Response('Not found', { status: 404 })
}

return new Response(object.body, {
  headers: { 'Content-Type': object.httpMetadata.contentType ?? 'application/octet-stream' }
})
```

Keys are case-sensitive and can be almost any string. Pick them once and stick with them, because renaming an object means copying it to a new key and deleting the old one.

### Strongly consistent

R2 is strongly consistent. Once the Promise from `put` resolves, the object is visible to every subsequent read, and once `delete` resolves it's gone.

::warning
If two Workers write to the same key, the last one wins. If this is a concern, you can use <a class="tori-glossary-link" href="?glossary=durable-objects">Durable Objects</a> to coordinate writes.
::

Under the hood, the R2 Gateway encrypts the bytes and writes them to storage, then commits metadata through a service built on Durable Objects. The success response only goes back to the client after that commit, so an acknowledged write can't silently disappear.

### What might you use it for?

R2 is a good fit for any scenario where you store a blob of bytes once and read it many times. A few examples:
- User uploads like profile pictures, where the same image is fetched on every profile view.
- Media hosting for images or video, served to a global audience without egress fees.
- Backups and archives that you write on a schedule and rarely read.
- Large files that people download often, where free egress keeps the bill predictable.
