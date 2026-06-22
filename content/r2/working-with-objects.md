---
title: 'Working with objects'
category: 'R2'
description: 'A closer look at the R2 API: metadata, listing, ranges, multipart uploads, and deleting what you no longer need.'
storybook: 'r2'
author: 'tori'
---

Once a bucket exists and a Worker can reach it, most day-to-day work comes down to four operations: writing objects with the right metadata, reading them back (sometimes only part of one), listing what's in a bucket, and deleting what you no longer need.

### Writing objects with metadata

`put` takes a key, a body, and an optional options object. The body can be a string, an `ArrayBuffer`, a `ReadableStream`, or `null` (useful for creating a placeholder key). The options let you attach two kinds of metadata:

```ts
await env.MY_BUCKET.put('reports/2026-06.json', body, {
  // These map to HTTP headers on every GET response, so the
  // browser sees the right MIME type and cache policy.
  httpMetadata: {
    contentType: 'application/json',
    contentLanguage: 'en',
    cacheControl: 'public, max-age=3600'
  },
  // Never sent to clients; use this for anything only your
  // Worker needs to know about the object.
  customMetadata: {
    uploadedBy: 'tori',
    source: 'nightly-job'
  }
})
```

**`httpMetadata`** is what the browser sees. Set `contentType` so responses get the right MIME type, and `cacheControl` so Cloudflare's edge can cache hot objects. **`customMetadata`** is for your own bookkeeping, things like who uploaded a file or which job produced it.

::info
You can update metadata on an existing object without re-uploading the body. Call `put` with `onlyIf` omitted and pass `null` as the body to keep the bytes, or use the `writeHttpMetadata` / `writeCustomMetadata` helpers on a `head` result. The simplest pattern is to re-`put` with the original body when you have it.
::

### Reading objects

`get` returns an `R2ObjectBody` or `null` if the key doesn't exist. The body is a `ReadableStream`, so you can pipe it straight into a response without buffering the whole file into memory:

```ts
const object = await env.MY_BUCKET.get('reports/2026-06.json')

if (object === null) {
  return new Response('Not found', { status: 404 })
}

return new Response(object.body, {
  headers: {
    'Content-Type': object.httpMetadata.contentType ?? 'application/octet-stream',
    'Cache-Control': object.httpMetadata.cacheControl ?? 'no-cache'
  }
})
```

If you only need metadata and not the bytes, call `head` instead. It returns the same object info without streaming the body, which is cheaper and faster when you just want to check whether a file exists or read its `customMetadata`:

```ts
const info = await env.MY_BUCKET.head('reports/2026-06.json')

if (info === null) {
  console.log('No such object')
} else {
  console.log(info.size, info.uploaded, info.customMetadata)
}
```

### Range requests

For large files, browsers and video players ask for a slice of an object using the `Range` header. R2 supports this through the `range` option on `get`, so you can serve partial content without loading the whole file:

```ts
const range = request.headers.get('Range')

const object = await env.MY_BUCKET.get('video.mp4', {
  range: range ?? undefined
})

if (object === null) {
  return new Response('Not found', { status: 404 })
}

// object.range is set when R2 honored the slice; the headers below
// tell the client which bytes it actually received.
return new Response(object.body, {
  status: 206,
  headers: {
    'Content-Range': `bytes ${object.range.offset}-${object.range.offset + object.range.length - 1}/${object.size}`,
    'Content-Length': object.range.length.toString(),
    'Content-Type': 'video/mp4'
  }
})
```

The `206 Partial Content` status and `Content-Range` header tell the client this is a slice, not the whole file. A video player uses them to seek to the middle of a long file without downloading it from the start.

### Listing objects in a bucket

`list` returns the keys in a bucket, paginated and sorted lexicographically. Pass a `prefix` to scope it to a "folder", a `cursor` to fetch the next page, and a `limit` to control page size:

```ts
let cursor: string | undefined
const allKeys: string[] = []

do {
  const page = await env.MY_BUCKET.list({
    prefix: 'reports/2026/',
    cursor,
    limit: 500
  })

  for (const object of page.objects) {
    allKeys.push(object.key)
  }

  cursor = page.truncated ? page.cursor : undefined
} while (cursor !== undefined)
```

::info
`list` is eventually consistent. A key you just `put` may take a moment to appear in list results, even though `get` returns it immediately. Build your app so reads-by-key are the hot path and `list` is for browsing and admin views.
::

### Multipart uploads

For files larger than a few hundred megabytes, upload them in parts with `createMultipartUpload`, `uploadPart`, and `completeMultipartUpload`. Each part can be uploaded independently and in parallel, and if one fails you retry just that part instead of the whole file:

```ts
const multipart = await env.MY_BUCKET.createMultipartUpload('big-video.mp4', {
  httpMetadata: { contentType: 'video/mp4' }
})

const parts: R2UploadedPart[] = []
for (let i = 0; i < chunks.length; i++) {
  const part = await multipart.uploadPart(i + 1, chunks[i])
  parts.push(part)
}

await multipart.complete(parts)
```

If you abandon a multipart upload, call `abort` to clean up the partial parts, otherwise they count against your storage until they expire.

### Deleting objects

`delete` removes a single object by key. `delete` also accepts an array of keys for a batch delete, which is far faster than calling it once per file when you're cleaning up a folder:

```ts
// Delete one
await env.MY_BUCKET.delete('reports/2026-06.json')

// Delete many at once
const stale = await env.MY_BUCKET.list({ prefix: 'reports/2025/' })
await env.MY_BUCKET.delete(stale.objects.map((o) => o.key))
```

::warning
Deletes are permanent. R2 has no recycle bin, so once `delete` returns the object is gone. If you need to recover from mistakes, keep backups in a second bucket or use versioning if it's enabled on the bucket.
::
