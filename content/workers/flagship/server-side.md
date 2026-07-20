---
title: 'Evaluate flags on the server'
category: 'Workers'
description: 'Use the native Worker binding, safe fallbacks, context, and rollout diagnostics.'
storybook: 'flagship'
author: 'tori'
---

Use the native Flagship binding when a Cloudflare Worker evaluates flags. Wrangler provides the binding as `env.FLAGS`, so the Worker can evaluate the Flagship app without storing a Cloudflare API token in its own configuration. Flagship evaluates against configuration already published to Cloudflare's network, rather than requiring the Worker to make a management API request for every decision.

Build the flag check near the point where the Worker chooses a behavior. Evaluate a flag once, save the result, and use that result for the rest of the request. This keeps the chosen path, logs, and response tied to the same evaluation.

::info
Flag changes usually propagate within seconds, but Cloudflare allows up to 30 seconds. During that window, requests can receive the prior configuration. Plan rollouts and rollbacks around that delay.
::

### Evaluate once per request

Use a typed method that matches the variants configured for the flag. `getBooleanDetails()` accepts a flag key, an application fallback, and an optional evaluation context. The example evaluates `new-checkout` once, uses `false` as the safe fallback, and passes a stable `userId` for targeting and percentage rollouts.

```ts
interface Env {
  FLAGS: Flagship
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId") ?? "anonymous"

    const checkout = await env.FLAGS.getBooleanDetails(
      "new-checkout",
      false,
      {
        userId,
        country: request.cf?.country ?? "unknown",
      },
    )

    if (checkout.errorCode) {
      console.error("Flag evaluation failed", {
        flagKey: checkout.flagKey,
        errorCode: checkout.errorCode,
      })
    }

    return Response.json({
      checkout: checkout.value ? "new" : "standard",
      variant: checkout.variant ?? null,
      reason: checkout.reason ?? null,
    })
  },
}
```

Use `getBooleanValue`, `getStringValue`, `getNumberValue`, or `getObjectValue` when only the value is needed. Use `get*Details` while verifying a rollout or recording sampled diagnostics. Details include the selected `variant`, the `reason` for the decision, and an `errorCode` when Flagship returned the fallback.

The application fallback is separate from the Flagship default variation. Flagship returns its configured default when a flag is disabled or no rule matches. The method fallback is returned when evaluation cannot produce a valid value, such as when a key is absent or the flag type does not match the method. Set both to the existing, safe behavior for a release flag.

| Flag value type | Worker method | Example fallback |
| --- | --- | --- |
| Boolean | `getBooleanValue()` | `false` |
| String | `getStringValue()` | `"classic"` |
| Number | `getNumberValue()` | `10` |
| JSON object | `getObjectValue()` | `{ enabled: false }` |

### Use details to verify a release

The details result distinguishes a targeting decision from a default or disabled flag. Record only the fields needed for diagnostics:

```ts
const checkout = await env.FLAGS.getBooleanDetails(
  "new-checkout",
  false,
  context,
)

console.log("Flag evaluation", {
  flagKey: checkout.flagKey,
  variant: checkout.variant,
  reason: checkout.reason,
  errorCode: checkout.errorCode,
})
```

`TARGETING_MATCH` indicates that a targeting rule selected the variant. `SPLIT` indicates that a percentage rollout assigned the request to its bucket. `DEFAULT` means no rule matched, and `DISABLED` means Flagship returned the configured default because the flag is off. Treat `ERROR` or any `errorCode` as an observability event: the Worker has used its method fallback.

### Keep the context small and stable

Context attributes can be strings, numbers, or booleans. Their names and values must match the targeting rules configured in Flagship. A rule for `plan = enterprise` will not match a context that provides `subscriptionTier` instead.

```ts
const context = {
  userId: session.user.id,
  plan: session.user.plan,
  country: request.cf?.country ?? "unknown",
}
```

For a user-facing percentage rollout, use a durable identifier such as `userId`, account ID, or organization ID. Flagship hashes the selected attribute, which keeps the same user in the same bucket. A changing value, such as a request ID, is suitable for request sampling but not for a consistent user experience. Use the same attribute in Worker context and in the rollout configuration.

::warning
Do not send sensitive personal data merely because it is available. Context is decision input, not an analytics payload. Avoid logging full contexts; log an error code or a redacted identifier instead.
::

### Target and roll out safely

Start with a rule for an internal or low-risk group. Add a small percentage rollout using the stable attribute passed from the Worker:

```sh
npx wrangler flagship flags rollout <APP_ID> new-checkout \
  --to on \
  --percentage 5 \
  --by userId
```

Manage rules in the <a href="https://dash.cloudflare.com/?to=/:account/flagship" target="_blank" rel="noopener noreferrer" class="tori-link">Flagship dashboard</a> or with Wrangler. Increase deliberately through values such as 5%, 25%, 50%, and 100%, monitoring errors and behavior after each configuration change. Rules run in order, so place narrow rules before broad rules. An unconditional rule matches every request and prevents later rules from running.

::warning
The `rollout` and `split` Wrangler commands replace the flag's whole rule set. Inspect and preserve any existing targeting rules before using them.
::

You can test the configured decision independently of application code:

```sh
npx wrangler flagship flags evaluate <APP_ID> new-checkout \
  --targeting-key user-42 \
  --context plan=enterprise \
  --context country=US
```

Use the same context names as the Worker. The CLI sends context values as strings, so use values that match the targeting rule and the request you intend to verify.

### Remove released flags

After a release reaches 100%, set the winning variant as the Flagship default and remove temporary rules. Deploy the code change that removes the old behavior, then disable the flag and observe the application through the propagation window. Delete the flag after the code cleanup is live.