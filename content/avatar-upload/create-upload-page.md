---
title: 'Create the upload page'
category: 'Workers'
description: 'Build a simple page that lets users pick, preview, and submit an avatar image.'
storybook: 'avatar-upload'
author: 'tori'
---

For this first step, build a plain form with one file input, one preview area, and one submit button.

### 1) Build the page UI

Create a route like `/account/avatar` with:

- An `<input type="file" accept="image/*">`
- A preview `<img>` that updates when a file is selected
- A submit button that stays disabled until a valid file is chosen

Keep the layout simple. The page only needs to solve one task clearly: upload an avatar.

### 2) Validate in the browser first

Before you send anything to your API:

- Reject files larger than your chosen limit (for example 2 MB)
- Reject non-image MIME types
- Show a short, user-friendly message when validation fails

Client checks improve UX, but they do **not** replace server checks. The API will still validate everything again.

### 3) Send the file to your API

On submit, send the selected file with `FormData` to an API route such as `/api/avatar`.

```ts
const form = new FormData()
form.append('avatar', selectedFile)

await fetch('/api/avatar', {
  method: 'POST',
  body: form
})
```

If upload succeeds, update the profile avatar URL on the page so users see the result immediately.

::info
Use a loading state on the submit button while the upload is in progress. It prevents duplicate requests and makes the app feel more reliable.
::
