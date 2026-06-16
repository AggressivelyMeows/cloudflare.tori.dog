---
title: 'Setting up your first Worker'
category: 'Workers'
description: "Install Wrangler, create your first Worker, and get it running locally."
storybook: 'workers-intro'
---

In the last Lab, we learned what a Worker is. Now let's build one. By the end of this Lab, you'll have Wrangler installed, a Worker running on your machine, and the basics you need to deploy it.

### Before you start

You'll need a couple of things installed first:

- <a href="?glossary=node" class="tori-glossary-link">Node.js</a> (version 18 or newer)
- <a href="?glossary=npm" class="tori-glossary-link">npm</a>, which comes bundled with Node.js

You can check if you already have them by running:

```bash
node --version
npm --version
```

If both commands print a version number, you're good to go.

::warning
If `node --version` shows a version older than 18, some Cloudflare tools won't work correctly. Update Node.js before continuing. We recommend installing it through the <a href="https://nodejs.org/">official Node.js website</a> or a version manager like `nvm`.
::

### Step 1: Create your first Worker

Cloudflare provides a single command that sets up a new project for you, including Wrangler. You don't need to install Wrangler separately.

```bash
npm create cloudflare@latest
```

This launches an interactive setup. It will ask you a few questions:

- **Where to create the project**: pick a folder name, like `my-first-worker`.
- **What type of application**: choose `Hello World` to start simple.
- **Which language**: pick TypeScript or JavaScript.
- **Whether to use git**: yes is a good default.
- **Whether to deploy now**: choose no for now, since we want to test locally first.

When it finishes, move into your new project folder:

```bash
cd my-first-worker
```

::info
The `npm create cloudflare@latest` command also installs Wrangler locally inside your project. This is on purpose. Installing Wrangler per project keeps each project on the version it was built with and avoids conflicts.
::

### Step 2: Look at what was created

Open the folder in your code editor. You'll see a few important files:

- `src/index.ts`: your Worker code. This is where you'll spend most of your time.
- `wrangler.jsonc`: your project's configuration file. Bindings and settings go here.
- `package.json`: lists your project's dependencies.

The starter Worker looks something like this:

```ts
export default {
  async fetch(request: Request) {
    return new Response('Hello, world!')
  },
}
```

### Step 3: Run it locally

You can run your Worker on your own machine before deploying it. From inside your project folder, run:

```bash
npx wrangler dev
```

Wrangler will start a local server and print a URL, usually `http://localhost:8787`. Open it in your browser and you should see `Hello, world!`.

::info
We use `npx` here so that the command runs the version of Wrangler installed in your project, rather than a global one. Get into the habit of using `npx wrangler` for all commands.
::

::warning
The first time you run `wrangler dev`, it may ask to log in to your Cloudflare account or download some files. This is normal. If you don't have a Cloudflare account yet, you can create a free one at <a href="https://dash.cloudflare.com/sign-up">dash.cloudflare.com</a>.
::

### Step 4: Make a change

Try editing `src/index.ts` and changing the message:

```ts
export default {
  async fetch(request: Request) {
    return new Response('My first Worker is alive!')
  },
}
```

Save the file. Wrangler automatically reloads, so just refresh your browser to see the new message. No restart needed.

### Installing dependencies

Most real projects use extra packages. You install them with npm, just like any other Node.js project:

```bash
# Example: install a date formatting library
npm install dayjs
```

Then import and use it in your Worker:

```ts
import dayjs from 'dayjs'

export default {
  async fetch(request: Request) {
    return new Response(`The time is ${dayjs().format()}`)
  },
}
```

::warning
Not every npm package works in a Worker. Workers run in a special environment, not in Node.js, so packages that rely on Node features like the file system (`fs`) or native modules may fail. Stick to packages that work in the browser or are built for Workers when possible.
::

### Common pitfalls

A few things tend to trip up new users:

- **Running commands in the wrong folder.** Wrangler commands must be run from inside your project folder, where `wrangler.jsonc` lives. If you see a "no config found" error, check where you are with `pwd` or `cd` into the right folder.
- **Using a global Wrangler install.** Mixing a globally installed Wrangler with a local one can cause version mismatches. Prefer `npx wrangler` so you always use the project's version.
- **Port already in use.** If `localhost:8787` won't load, another program may be using that port. You can pick a different one with `npx wrangler dev --port 8788`.
- **Forgetting to save.** Hot reload only works after you save the file. If your changes aren't showing, save and refresh.

### Recap

- Create a project and install Wrangler in one step with `npm create cloudflare@latest`.
- Run your Worker locally with `npx wrangler dev`.
- Edit `src/index.ts` to change your Worker's behavior, with automatic reloads.
- Install packages with `npm install`, but watch out for ones that need Node.js features.

In the next Lab, we'll deploy this Worker to Cloudflare's network so the whole world can reach it.