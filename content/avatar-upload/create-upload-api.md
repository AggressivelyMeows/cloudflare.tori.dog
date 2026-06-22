---
title: 'Create the upload API'
category: 'Workers'
description: 'Now let's build the Worker that catches the file and saves it to R2.'
storybook: 'avatar-upload'
author: 'tori'
---

Cool, so the page can send files now. Let's build the thing that catches them!

Our API route needs to do three jobs: grab the file from the request, make sure it's safe, and drop it into <a class="tori-glossary-link" href="?glossary=r2">R2</a>. Let's walk through each one.

### Grab the file

When a `FormData` request lands, we pull out the file like this:

```ts
const form = await request.formData()
const avatar = form.get('avatar')
```

If there's no file attached (or someone sends garbage), we just return a `400 Bad Request` and call it a day.

### Make sure it's legit

Remember how we did checks in the browser? We do them again here. Always. The browser checks are a courtesy — the server checks are the law.

- Is it actually an image? (`image/jpeg`, `image/png`, `image/webp`)
- Is it under our size limit?

If it fails, return an error. Don't store junk in your bucket.

### Save it to R2

Now the fun part! We pick a key based on the user's ID (so everyone's avatar lives in a predictable spot) and write it:

```ts
const key = `avatars/${user.id}/original.webp`
await env.AVATARS.put(key, avatar.stream(), {
  httpMetadata: { contentType: 'image/webp' },
  customMetadata: { userId: user.id }
})
```

Then we send back the URL so the frontend can display it immediately.

### A note on auth

This should go without saying, but only logged-in users should be able to upload, and they should only be able to write to *their own* avatar slot. Don't trust a user ID that comes from the client — always pull it from your auth session.

::warning
Never rely on file extensions to decide if something is safe. Always check the actual content type on the server.
::
