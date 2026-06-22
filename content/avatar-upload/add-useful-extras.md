---
title: 'Add useful extras'
category: 'Workers'
description: 'Finish your avatar flow with resizing, cleanup, caching, and abuse protection.'
storybook: 'avatar-upload'
author: 'tori'
---

Once the basic upload works, add a few practical improvements so the feature is production-friendly.

### 1) Generate size variants

Create a small set of variants (for example 64, 128, and 256 pixels) so clients can request the right size for each UI context.

- Store variants under predictable keys
- Keep one canonical source image
- Re-generate variants when users replace avatars

### 2) Add cache headers

Avatar images are read frequently, so cache them aggressively:

- Add `Cache-Control` headers on responses
- Use versioned URLs (or a hash in the key) to avoid stale images after updates

This keeps requests fast and reduces origin reads.

### 3) Clean up old files

When users upload a new avatar:

- Delete old variants in the background
- Keep short-lived backups only if your product needs rollback

Without cleanup, storage costs quietly grow over time.

### 4) Add basic abuse controls

Protect the endpoint with simple controls:

- Per-user rate limits
- Upload size limits
- Request logging for failed attempts

These checks make accidental misuse and simple abuse much easier to handle.

### 5) Improve UX details

Round out the flow with:

- Inline error messages
- Retry after transient failures
- Accessible labels and status text for screen readers

The core logic stays small, but the final experience feels much more polished.
