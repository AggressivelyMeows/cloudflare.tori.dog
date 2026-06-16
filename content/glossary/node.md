---
title: 'NodeJS'
tags: 'language,tools'
---

**Node.js** is a program that lets your computer run JavaScript outside of a web browser.

JavaScript was originally made to run inside websites. Node.js takes that same language and lets it run directly on your machine, which is how tools like Wrangler (Cloudflare's command-line tool) work behind the scenes.

> **In short:** Node.js is the engine that runs the Cloudflare developer tools on your computer.

## The Words You'll See Most

**npm**
Short for "Node Package Manager." It comes bundled with Node.js and lets you download and install code packages other people have written. You'll use it a lot.

```bash
npm install some-package
```

**Package**
A bundle of reusable code you can add to your project. Instead of writing everything yourself, you install packages that already do the job.

**`package.json`**
A file in your project that lists which packages it uses. npm reads this file to know what to install.

**Version**
Node.js gets updated over time. Cloudflare tools need a recent enough version (usually 18 or newer) to work properly.

## How to Check if You Have It

Open your terminal and run:

```bash
node --version
npm --version
```

If both print a number, Node.js is installed. If you get an error like "command not found," you'll need to install it first.


## How to Install It

You have a few options. We recommend **nvm** for most people, since it makes switching versions easy, but installing through your system's package manager works fine too.

### Option 1: nvm (recommended)

**nvm** ("Node Version Manager") installs Node.js for you and lets you switch between versions. This is handy when different projects need different versions.

**On Linux and macOS:**

```bash
# Download and run the install script
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

Close and reopen your terminal, then install the latest stable Node.js:

```bash
# Install the latest LTS version
nvm install --lts

# Use it
nvm use --lts
```

::info
Always check the latest install command on the <a href="https://github.com/nvm-sh/nvm" rel="noopener noreferrer" target="_blank" class="tori-link">nvm GitHub page</a>, as the version number in the URL changes over time.
::

**On Windows:**

The original nvm doesn't run on Windows, but there's a separate tool called **nvm-windows** that does the same job. Download the installer from the <a href="https://github.com/coreybutler/nvm-windows/releases" rel="noopener noreferrer" target="_blank" class="tori-link">nvm-windows releases page</a>, then run:

```powershell
nvm install lts
nvm use lts
```

### Option 2: Your system's package manager

If you'd rather not use nvm, you can install Node.js through the tool your operating system already uses for software.

**Linux (Debian / Ubuntu):**

```bash
sudo apt update
sudo apt install nodejs npm
```

**Linux (Fedora):**

```bash
sudo dnf install nodejs npm
```

**Linux (Arch):**

```bash
sudo pacman -S nodejs npm
```

::warning
Some Linux distributions ship an older version of Node.js in their default repositories. If `node --version` shows a version below 18 after installing, use nvm instead, or follow the <a href="https://nodejs.org/en/download/package-manager" rel="noopener noreferrer" target="_blank" class="tori-link">official NodeSource instructions</a> to get a newer version.
::

**Windows (winget):**

```powershell
winget install OpenJS.NodeJS.LTS
```

**Windows (Chocolatey):**

```powershell
choco install nodejs-lts
```

**macOS (Homebrew):**

```bash
brew install node
```

### Option 3: The official installer

If you'd prefer not to use the command line at all, download the installer directly:

- 📥 [nodejs.org](https://nodejs.org/)

Pick the **LTS** version ("Long Term Support"), which is the stable, recommended choice for most people.


## Why Cloudflare Needs It

Cloudflare's main tools run on Node.js:

- **Wrangler** uses it to create, test, and deploy your Workers.
- **npm** (which comes with it) installs the packages your projects depend on.

Without Node.js installed, commands like `npm create cloudflare@latest` won't run.