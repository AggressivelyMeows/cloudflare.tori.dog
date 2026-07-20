---
title: 'Use evaluated flag values in browser'
category: 'Workers'
description: 'List and evaluate Flagship flags in a Worker, then return values without exposing flag configuration.'
storybook: 'flagship'
author: 'tori'
---

Build a `/feature-flags` endpoint that accepts evaluation context in its query string, such as `userId` and `plan`. Inside the Worker, use a Flagship read token to list the flags in the configured app, then evaluate each returned key with the native `env.FLAGS` binding. The binding uses the request context and the configuration already published to Cloudflare's network. The browser never calls the Flagship management API directly.

The Worker keeps the flag list, enabled state, rules, variations, default-variation names, and API token private. It sends the browser one ordered array containing only the evaluated values. The browser can use those values to render the current experience, while the Worker retains the configuration required to decide how each value was selected.

### List and evaluate flags in the Worker

The Worker reads the evaluation context from the request query string and turns it into an object for Flagship.

```ts
interface Env {
  FLAGS: Flagship
  FLAGSHIP_ACCOUNT_ID: string
  FLAGSHIP_APP_ID: string
  FLAGSHIP_API_TOKEN: string
}

type Flag = {
  key: string
  default_variation: string
  variations: Record<string, unknown>
}

type FlagshipListResponse = {
  result: Flag[]
  result_info: {
    cursor: string | null
  }
}

const listFlags = async (env: Env): Promise<Flag[]> => {
  const flags: Flag[] = []
  let cursor: string | null = null

  do {
    const searchParams = new URLSearchParams({ limit: "200" })
    if (cursor) searchParams.set("cursor", cursor)

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.FLAGSHIP_ACCOUNT_ID}/flagship/apps/${env.FLAGSHIP_APP_ID}/flags?${searchParams}`,
      {
        headers: { Authorization: `Bearer ${env.FLAGSHIP_API_TOKEN}` },
      },
    )

    if (!response.ok) throw new Error("Could not list Flagship flags")

    const page = await response.json() as FlagshipListResponse
    flags.push(...page.result)
    cursor = page.result_info.cursor
  } while (cursor)

  return flags
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname !== "/feature-flags") {
      return new Response("Not found", { status: 404 })
    }

    try {
      const context = Object.fromEntries(url.searchParams)
      const flags = await listFlags(env)
      const values = await Promise.all(
        flags.map((flag) => {
          const fallback = flag.variations[flag.default_variation]
          return env.FLAGS.get(flag.key, fallback, context)
        }),
      )

      return Response.json({ values }, {
        headers: { "Cache-Control": "private, no-store" },
      })
    } catch {
      return Response.json({ error: "Could not evaluate feature flags" }, { status: 502 })
    }
  },
}
```

The management API returns keys and default variations only to the Worker. `env.FLAGS.get()` evaluates each key against the request context. The browser receives a `values` array in the same order as Flagship's key-ordered list, with no key, rule, variation, enabled-state, or targeting data.

Set the management token as a Worker secret. You'll also need to set your Account ID, and the Flagship app ID as secrets.

::info
Storing variables as secrets prevents Wrangler from overwriting them when you deploy. The Worker can read them in plain text, but they are not exposed to the browser or in the Worker bundle.
::

```sh
npx wrangler secret put FLAGSHIP_API_TOKEN
npx wrangler secret put FLAGSHIP_ACCOUNT_ID
npx wrangler secret put FLAGSHIP_APP_ID
```

::warning
The token needs `flagship:read` permission. The endpoint follows the API cursor until it has listed every flag.
::

### Fetch the values from the browser

Pass the evaluation context in the query string:

```ts
type FeatureFlagValues = {
  values: unknown[]
}

const { values } = await fetch(
  "/feature-flags?userId=user-42&plan=enterprise",
)
  .then((response) => {
    if (!response.ok) throw new Error("Could not evaluate feature flags")
    return response.json()
  }) as FeatureFlagValues

console.log(values)
```

::warning
Do not trust user-supplied context for authorization or entitlement decisions. Derive protected attributes such as a user's plan or organization from an authenticated session in the Worker. A feature flag controls exposure, not access control.
::

### Remove a fully released flag

Make the winning variant the Flagship default, remove temporary targeting rules, and deploy the code cleanup that removes the old path. Disable the flag, observe the application through the propagation window, then delete the flag.