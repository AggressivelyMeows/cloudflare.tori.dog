---
title: 'Lab overview'
category: 'Workers'
description: 'What we're building, why it's cool, and how it all fits together.'
storybook: 'avatar-upload'
author: 'tori'
---

Hey! Welcome to the avatar upload Lab.

We're going to build something you've probably used a hundred times — that little "change your profile picture" button. Except this time, you'll understand every piece of how it works, from the moment someone picks a photo to the moment it shows up on their profile.

### So what are we actually building?

A real avatar upload flow! The kind you see on social media, forums, or any app with user profiles. Here's the gist:

1. A page where you pick a photo and see a preview before uploading
2. An API that catches the file, makes sure it's legit, and saves it
3. Storage in <a class="tori-glossary-link" href="?glossary=r2">R2</a> so the image sticks around
4. Some nice touches to make it feel production-ready

Nothing here is theoretical — by the end you'll have something that actually works.

### How does the whole thing connect?

Think of it like a relay race:

1. You pick an image on the page
2. The page hands it off to your API
3. The API checks it's a valid image and drops it into R2
4. R2 gives back a URL
5. The page shows your shiny new avatar

That's it! Each step in this Lab focuses on one leg of that relay so you never feel lost.

::info
Don't worry if some of these terms are new. We'll explain everything as we go. Just focus on the big picture for now — the details will make sense once we start building.
::
