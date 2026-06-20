---
title: 'What is Wrangler?'
category: 'Workers'
description: "Intro to Cloudflare Wrangler, the CLI tool for managing Cloudflare Workers."
storybook: 'wrangler'
author: 'tori'
---

Wrangler is the command-line tool you use to build, test, and deploy Cloudflare Workers. Think of it as the toolbox that sits between your code and Cloudflare's network.

You've actually used it already. When you ran `npx wrangler dev` in the last Lab, that was Wrangler quietly doing the work. This Lab takes a closer look at what it is and why you'll keep coming back to it.

::info
You don't need to install Wrangler globally. It comes bundled into every project you create with `npm create cloudflare@latest`, and running it through `npx wrangler` keeps you on the version your project expects.
::

### Why a separate tool?

A Worker is just code, so why do we need a special tool to make stuff? Theres a lot that goes into getting your code from your hands into the Cloudflare network, and Wrangler handles all of it for you:

- **Building**: Taking your code from your <a class="tori-glossary-link" href="?glossary=ide">IDE / Editor</a> and preparing it to run on Cloudflare's network.
- **Testing**: Running your Worker locally so you can see how it behaves before you deploy it.
- **Deploying**: Shipping your Worker to Cloudflare's network so it can start handling real traffic.
- **Managing**: Updating, configuring, and monitoring your Worker after it's live.

Wrangler does all of that for you. A handful of simple commands handle the messy parts behind the scenes, so you can focus on writing your Worker and let Wrangler take care of the rest.

### What Wrangler looks like

Wrangler is a command-line tool, which just means you run it by typing commands in your terminal instead of clicking around a window. You type something like `npx wrangler dev`, and Wrangler responds with text.

If you're new to the terminal, that might feel a bit bare at first. But it's where most development happens, and the commands are named after what they do: `dev` to run your Worker, `deploy` to ship it, `tail` to watch its logs. There's not much to memorize.

### Why not just use the dashboard?

Cloudflare also has a web dashboard, so why bother with Wrangler?

The dashboard is handy for quick checks and account-wide settings. But most day-to-day work happens in Wrangler. Your code, config, and deploys all live in one folder you can track with git, the commands slot neatly into automation, and the edit-save-refresh loop is faster than clicking through a website.

In practice you'll use both: Wrangler to build and ship, and the dashboard for things like billing and analytics.

### Recap

Wrangler is the command-line tool for building, testing, and deploying Cloudflare Workers, and you've already used it with `npx wrangler dev`. It handles the steps that get your code from your laptop onto Cloudflare's network, so you can focus on the code itself.

In the next Lab, you'll use Wrangler to deploy your Worker for the first time.
