---
title: 'Wrangler Configuration'
category: 'Workers'
description: "How to configure Wrangler for your Cloudflare Workers projects."
storybook: 'wrangler'
author: 'tori'
---

In the last Lab, you got a quick introduction to Wrangler and how it helps you build, test, and deploy your Workers. Now let's take a closer look at how to configure Wrangler for your projects.

Every Worker project has a settings file that Wrangler reads before it does anything. It tells Wrangler what your Worker is called, where your code lives, and what other Cloudflare services it can talk to. Get comfortable with this file and the rest of Wrangler starts to make a lot more sense.

### Where the file lives

When you create a project with `npm create cloudflare@latest`, Wrangler drops a config file at the root of your project. Depending on how the project was set up, it's named one of two things:

- `wrangler.jsonc`, which is JSON with comments
- `wrangler.toml`, which uses the TOML format

They do exactly the same job, just in different formats. Newer projects tend to use `wrangler.jsonc`, so that's what we'll use in this Lab. If your project has a `.toml` file instead, don't worry, the same settings exist in both.

::info
The `c` in `.jsonc` stands for "comments." Regular JSON doesn't let you write comments, but this format does, which is handy for leaving notes next to your settings.
::

### A first look

Here's a small config file. Don't worry about every line yet, we'll walk through it piece by piece.

```jsonc
{
  "name": "my-first-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-21"
}
```

Those three lines are the core of almost every Worker config. Let's go through them.

### name

```jsonc
"name": "my-first-worker"
```

This is what your Worker is called on Cloudflare. When you deploy, this becomes part of your Worker's URL and the name you'll see in the dashboard. Pick something short and recognizable.

### main

```jsonc
"main": "src/index.ts"
```

This points Wrangler at the entry file for your Worker, the file it should run when a request comes in. In most starter projects that's `src/index.ts`. If you move or rename that file, you'll need to update this line so Wrangler can still find it.

### compatibility_date

```jsonc
"compatibility_date": "2025-01-21"
```

This one looks odd at first. Cloudflare occasionally changes how Workers behave, and the compatibility date pins your Worker to how things worked on that day. That way an update on Cloudflare's side won't quietly break your Worker. You usually set it once when you create the project and leave it alone.

### Connecting other services with bindings

So far the config just describes your Worker. The real power shows up when you add **bindings**. A binding is a connection between your Worker and another Cloudflare service, like a database or file storage. Once a binding is set up, your code can use that service without any passwords or connection strings.

For example, to give your Worker access to an <a class="tori-glossary-link" href="?glossary=r2">R2</a> storage bucket, you'd add this:

```jsonc
{
  "name": "my-first-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-21",
  "r2_buckets": [
    {
      "binding": "MY_BUCKET",
      "bucket_name": "my-files"
    }
  ]
}
```

The `binding` value (`MY_BUCKET`) is the name your code uses to reach the bucket, and `bucket_name` is the actual bucket on Cloudflare. In your Worker, you'd then access it through `env.MY_BUCKET`.

Other services follow the same shape. A <a class="tori-glossary-link" href="?glossary=durable-objects">Durable Object</a>, a database, or a <a class="tori-glossary-link" href="?glossary=kv">KV</a> store each get their own section in the config, but they all boil down to "give this thing a name my code can use."

::info
You don't have to memorize the names of these sections. When you add a service through Cloudflare's tooling, it usually writes the binding into your config for you. The important idea is just *what* a binding is: a named connection your code can use.
::

### How Wrangler uses the file

Wrangler reads this config every time you run a command. When you run `npx wrangler dev`, it looks here to find your entry file and set up your bindings locally. When you run `npx wrangler deploy`, it uses the `name` to know which Worker to update and ships your bindings along with your code.

Because it's a plain file in your project, it gets committed to git alongside everything else. Anyone who opens your project can read the config and understand how the Worker is wired up.

::warning
Wrangler commands need to run from the folder that contains your config file. If you see a "no config found" error, you're probably in the wrong directory, `cd` into your project folder and try again.
::

### Recap

The Wrangler config file (`wrangler.jsonc` or `wrangler.toml`) is where your Worker's settings live. At a minimum it sets the `name` of your Worker, the `main` entry file, and a `compatibility_date`. Beyond that, bindings let you connect your Worker to other Cloudflare services using a name your code can reference. Wrangler reads this file on every command, so it always knows how your project is set up.

In the next Lab, you'll put this to use and deploy your Worker to Cloudflare's network.
