---
title: 'Introduction to Flagship'
category: 'Workers'
description: 'Create a Flagship app and connect a Worker to a safely configured feature flag.'
storybook: 'flagship'
author: 'tori'
---

A feature flag lets you deploy a new code path before you expose it to everyone. Cloudflare Flagship stores the decision separately from your Worker deployment, so you can target a group, increase a rollout, or turn a feature off without redeploying your application.

The examples use a `new-checkout` flag. A Worker evaluates it at the edge, then sends the browser the resulting UI decision without exposing Flagship credentials.

### How a flag is evaluated

Each Flagship app holds related flags. A flag has one or more variants, one default variant, and optional ordered targeting rules. Flagship checks rules in order and returns the first matching variant. If no rule matches, or the flag is disabled, it returns the configured default.

::info
Cloudflare says a change typically reaches the network within seconds, but it can take up to 30 seconds. A rollback needs a safe default and an allowance for the previous configuration to finish propagating.
::

### Defaults and fallbacks

There are two safeguards, and they are deliberately different:

- The **Flagship default variant** is returned when no targeting rule matches or the flag is disabled.
- The **application fallback** is the value passed to the evaluation method. It is used when evaluation fails, for example because the key is missing or the flag has the wrong type.

For a new release, make both values the existing behavior. In our example, that means the Flagship default and the Worker fallback are both `false`.

::warning
Disabling a flag does not mean "return false" automatically. It returns the configured default variant. Set that default to a safe state before treating a flag as a kill switch.
::

### Create the app and flag

Create the resources in the <a href="https://dash.cloudflare.com/?to=/:account/flagship" target="_blank" rel="noopener noreferrer" class="tori-link">Flagship dashboard</a>, or use Wrangler. From a Worker project, run:

```sh
npx wrangler flagship apps create checkout-service --binding FLAGS
npx wrangler flagship flags create <APP_ID> new-checkout --disabled
```

The first command prints the app ID. The second creates a boolean flag whose `off` variant is the default. Keep the app ID for the Worker configuration.

### Bind Flagship to the Worker

Add a `flagship` binding to `wrangler.jsonc`:

```jsonc
{
  "name": "checkout-worker",
  "main": "src/index.ts",
  "compatibility_date": "2026-07-20",
  "flagship": [
    {
      "binding": "FLAGS",
      "app_id": "<APP_ID>"
    }
  ]
}
```

`FLAGS` becomes `env.FLAGS` in your Worker. The native binding authenticates through the platform, so Worker code does not need to hold an API token.

Generate the updated Worker types after changing the binding:

```sh
npx wrangler types
```

::info
`wrangler dev` reads the live Flagship app named by `app_id`; it does not create a local flag store. Use a separate development app when local experiments must be isolated from production configuration.
::