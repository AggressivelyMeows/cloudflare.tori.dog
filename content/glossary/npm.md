---
title: 'Node Package Manager (npm)'
tags: 'tools'
---

**npm** stands for "Node Package Manager." It's a tool that downloads and manages the code packages your projects rely on.

Instead of writing every piece of code yourself, you can install packages that other people have already built and shared. npm fetches them, keeps track of what you've installed, and makes updating easy.

> **In short:** npm is how you add other people's code to your project, so you don't have to build everything from scratch.

It comes bundled with Node.js, so if you've installed Node.js, you already have npm.

## The Words You'll See Most

**Package**
A bundle of reusable code you add to your project. For example, a package might handle dates, make web requests, or format text.

**`package.json`**
A file that lists your project's packages and details. npm reads this to know what your project needs.

**`node_modules`**
The folder where npm stores the actual package code after installing. You don't edit this folder yourself, and you usually don't commit it to git.

**Dependency**
Any package your project depends on to work. They're all listed in `package.json`.

**Registry**
The online library npm downloads packages from. The default is the public <a href="https://www.npmjs.com/">npm registry</a>, which hosts millions of packages.

## The Commands You'll Use Most

**Install a package:**

```bash
npm install dayjs
```

This downloads the package and adds it to your `package.json`.

**Install everything a project needs:**

```bash
npm install
```

Run this after downloading a project (for example, from git). It reads `package.json` and installs every listed package.

**Remove a package:**

```bash
npm uninstall dayjs
```

**Run a project script:**

```bash
npm run dev
```

Scripts are shortcuts defined in `package.json`, like starting a local server.

## npm vs npx

You'll see both `npm` and `npx`. They're related but do different things:

- **`npm`** installs and manages packages.
- **`npx`** runs a package's command without installing it permanently.

This is why Cloudflare uses `npx wrangler dev`: it runs the version of Wrangler installed in your project, rather than a global one.

## Common Pitfalls

::warning
**Don't commit `node_modules` to git.** It's large and can be rebuilt anytime with `npm install`. Most projects ignore it using a `.gitignore` file.
If you're unsure, you can run `npx gitignore node` to generate a `.gitignore` for you.
::

::info
**`-g` installs packages globally.** A command like `npm install -g something` installs a package for your whole system instead of one project. For Cloudflare work, it's usually better to install per project and use `npx` to run commands.
::

- **Running npm in the wrong folder.** npm commands should be run from your project folder, where `package.json` lives.
- **Forgetting `npm install`.** If you download a project and it won't run, you probably need to install its dependencies first.

## Why Cloudflare Needs It

- It installs **Wrangler** and any packages your Worker uses.
- The `npm create cloudflare@latest` command uses npm to set up a new Worker project.
- You'll use `npm install` to add features to your projects as they grow.