---
title: 'Create the upload API'
category: 'Workers'
description: 'Create an API endpoint that validates avatar uploads and stores them in R2.'
storybook: 'avatar-upload'
author: 'tori'
---

Now connect your page to a Worker API endpoint that receives the file and stores it in <a class="tori-glossary-link" href="?glossary=r2">R2</a>.

### 1) Parse `multipart/form-data`

In `/api/avatar`, parse the incoming form data and read the `avatar` file:

```ts
const form = await request.formData()
const avatar = form.get('avatar')
```

Return `400` if the field is missing or not a file.

### 2) Enforce server-side validation

Always validate again on the server:

- Allow only expected image types (for example `image/jpeg`, `image/png`, `image/webp`)
- Enforce max size
- Optionally decode and re-encode to strip unsupported data

This keeps your storage clean and prevents clients from bypassing browser checks.

### 3) Write the object to R2

Use a deterministic key, often based on user ID:

```ts
const key = `avatars/${user.id}/original.webp`
await env.AVATARS.put(key, avatar.stream(), {
  httpMetadata: { contentType: 'image/webp' },
  customMetadata: { userId: user.id }
})
```

Then return JSON containing the public or signed URL the frontend should display.

### 4) Handle auth and ownership

Only authenticated users should upload avatars, and each user should only write to their own keyspace. Never trust a client-provided user ID.

::warning
Do not rely on file extensions for safety. Check MIME types and size server-side every time.
::
