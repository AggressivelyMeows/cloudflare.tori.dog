---
title: 'Lab overview'
category: 'Workers'
description: 'Start here to understand what this avatar upload lab builds, and how each piece works together.'
storybook: 'avatar-upload'
author: 'tori'
---

If you're new to Cloudflare tools, this is the best place to start.

In this Lab, you'll build a small avatar upload feature from end to end. By the end, you'll have a working flow where a user picks an image, uploads it through an API, and sees their new avatar show up in the app.

### What this Lab is about

This Lab is about learning how frontend and backend parts connect in a real feature:

- A simple upload page in your app
- A Worker API route that receives and validates the file
- R2 object storage where avatar images live
- A few practical extras so the feature is reliable in production

You do not need to be an expert first. We'll build one step at a time.

### What you'll make

You'll make a basic but realistic avatar system:

1. A page where users select an image, preview it, and submit
2. An API endpoint that checks file type and size before saving
3. Stored avatar files in R2, keyed by user identity
4. Quality-of-life improvements like caching, cleanup, and abuse limits

This is a strong starter pattern you can reuse for other uploads like documents, banners, or profile media.

### How it will function

At a high level, the flow works like this:

1. The user picks a file in the browser
2. The browser sends that file to your `/api/avatar` endpoint
3. The API validates the request and stores the file in R2
4. The API returns an avatar URL
5. The frontend updates the profile image with that URL

Each page in this storybook focuses on one piece of that chain so it's easier to understand and debug.

::info
As a beginner, focus on understanding the data flow first: browser -> API -> storage -> browser update. Once that clicks, everything else in this Lab is much easier.
::
