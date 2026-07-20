---
title: 'Limits and evaluation errors'
category: 'Workers'
description: 'Design Flagship apps within documented limits and handle evaluation fallbacks with details metadata.'
storybook: 'flagship'
author: 'tori'
---

Flagship configuration is distributed to Cloudflare's network, so an app needs a bounded set of flags and readable rules. The limits below define the size of one Flagship app and the shape of the data it can store. They also help decide when to split unrelated flags into separate apps.

Evaluation can return a valid default, a targeting result, or the fallback supplied by Worker code. Use a `get*Details()` method when the Worker needs to distinguish those outcomes. The returned `reason` and optional `errorCode` identify why the value was selected without requiring the Worker to log the full evaluation context.

### Plan around platform limits

| Feature | Limit |
| --- | --- |
| Apps per account | 10,000, soft limit |
| Flags per app | 5,000, soft limit |
| App, flag, and variant keys | 64 characters |
| Condition attribute names | 64 characters |
| Condition string values | 256 characters |
| Variant value | 10 KB |
| Condition nesting depth | 5 levels |
| Flag description | 512 characters |
| Serialized flag configuration per app | 25 MB |

The soft limits for apps and flags can be raised by Cloudflare support when needed. The 25 MB app limit includes all serialized flags, variants, and rules in the app. Use an app for a deployed service or clear product surface, not an unbounded collection of unrelated controls.

Keys can contain letters, numbers, hyphens, and underscores. Keep each key stable because Worker code calls it directly. All variations on one flag must share a type: boolean, string, number, or JSON. A type change can cause a typed evaluation method to return its fallback.

::warning
Variant values are configuration data, not executable code. Keep JSON values compact, validate them in the Worker before use, and stay within the 10 KB value limit.
::

### Keep rules shallow

A flat condition group has a nesting depth of one. Flagship permits up to five levels of nested `AND` and `OR` groups. A deeply nested rule can fit within that limit while remaining difficult to inspect or test.

Break a complex audience into ordered rules where possible. Put narrow, high-priority segments first and a broad rule last. Test representative contexts before changing a rule that controls a release.

### Read evaluation details

Details methods return the evaluated value with metadata. Use a fallback that preserves the existing behavior, then record only fields that help diagnose the result:

```ts
const checkout = await env.FLAGS.getBooleanDetails(
  "new-checkout",
  false,
  { userId: "user-42", plan: "enterprise" },
)

console.log("Flag evaluation", {
  flagKey: checkout.flagKey,
  value: checkout.value,
  variant: checkout.variant,
  reason: checkout.reason,
  errorCode: checkout.errorCode,
})
```

| Reason | Result |
| --- | --- |
| `TARGETING_MATCH` | A targeting rule matched the context and returned its variation. |
| `SPLIT` | A rollout rule matched and the context landed within its percentage. |
| `DEFAULT` | No targeting rule matched, so Flagship returned the configured default variation. |
| `DISABLED` | The flag is disabled, so Flagship returned the configured default variation without applying rules. |
| `CACHED` | The SDK returned a cached evaluation result. |
| `ERROR` | Evaluation failed, so the method returned the fallback value supplied by Worker code. |

`DEFAULT` and `DISABLED` are successful evaluations. They do not indicate that the Worker fallback was used. `ERROR` indicates a failed evaluation and is the condition to monitor alongside `errorCode`.

### Handle evaluation failures

When evaluation fails, Flagship returns the fallback passed to the method. Details methods include one of these error codes:

| Error code | Cause | Response |
| --- | --- | --- |
| `TYPE_MISMATCH` | The flag's configured variation type differs from the typed method used in code. | Check the flag type and the Worker method, then keep the fallback safe. |
| `FLAG_NOT_FOUND` | The requested key is absent from the app. | Check the key, binding, and app configuration. |
| `INVALID_CONTEXT` | The context contains unsupported values, such as objects or arrays in HTTP evaluation. | Pass only supported primitive attributes. |
| `PARSE_ERROR` | The SDK received an invalid evaluation response. | Record the event and retain the fallback. |
| `GENERAL` | An unexpected failure occurred, such as a timeout or network failure. | Record the event and retain the fallback. |

```ts
if (checkout.errorCode) {
  console.error("Flag evaluation fallback", {
    flagKey: checkout.flagKey,
    errorCode: checkout.errorCode,
  })
}
```

::warning
Do not log the complete context by default. Context can contain identifiers, plan information, or other customer data. Log the error code and a redacted or sampled identifier when diagnostics need correlation.
::

### Test expected outcomes

Verify at least one context for each important rule, one context that receives the default, and one disabled-flag response. Use the same attribute names as Worker code:

```sh
npx wrangler flagship flags evaluate <APP_ID> new-checkout \
  --targeting-key user-42 \
  --context plan=enterprise \
  --context country=US
```

Test an incorrect key or typed-method mismatch in development to confirm that the Worker fallback is safe. A release flag should remain safe when Flagship returns `DEFAULT`, `DISABLED`, or `ERROR`.