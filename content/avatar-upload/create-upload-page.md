---
title: 'Create the upload page'
category: 'Workers'
description: 'Let's build the page where users pick and preview their new avatar.'
storybook: 'avatar-upload'
author: 'tori'
---

Alright, let's start with the fun part — the page your users will actually see.

We need three things: a file picker, a preview so they can see what they chose, and a button to send it off. That's the whole page. Nice and simple.

### The file picker

HTML gives us a built-in file picker for free. We just tell it we only want images:

```html
<input type="file" accept="image/*" />
```

When someone picks a file, we can grab it and show a preview right away using `URL.createObjectURL`. It's instant and doesn't need a server round-trip — the browser handles it locally.

### Quick sanity checks

Before we bother sending anything to our API, let's catch obvious problems early:

- Is the file actually an image? (Check the MIME type)
- Is it under 2 MB? (Or whatever limit makes sense for your app)

If something's off, just show a friendly message. No need to hit the server for something we already know is wrong.

::info
These browser-side checks are just for a nice user experience. The API will double-check everything anyway — never trust the client!
::

### Sending it off

When they hit upload, we pack the file into a `FormData` and fire it at our API:

```ts
const form = new FormData()
form.append('avatar', selectedFile)

await fetch('/api/avatar', {
  method: 'POST',
  body: form
})
```

Throw a little loading spinner on the button while it's working, and once it comes back successful, swap in the new avatar URL. Done! Your user just uploaded a profile picture.

The browser side is honestly the easiest part. Next up, we'll build the API that actually receives and stores the file.
