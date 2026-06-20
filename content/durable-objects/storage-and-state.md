---
title: 'Storage and state'
category: 'Durable Objects'
description: 'A closer look at the Durable Object storage API: SQLite and key-value backends, reading, writing, listing, transactions, and alarms.'
storybook: 'durable-objects'
author: 'tori'
---

Each Durable Object has its own private storage that persists as long as the object exists. You access it through `this.ctx.storage`.

### Choosing a storage backend

A Durable Object class has one of two storage backends, fixed when the class is first created through a migration.

**SQLite backend** gives you a private SQLite database (`this.ctx.storage.sql`) alongside a key-value API. It also unlocks point-in-time recovery, which can restore the object's data to any moment in the last 30 days. Cloudflare recommends this backend for all new classes.

**Key-value backend** is the original option. It offers only the asynchronous key-value API, with no SQL and no point-in-time recovery. It remains for backwards compatibility with existing namespaces.

| Capability | SQLite backend | Key-value backend |
| --- | --- | --- |
| Key-value API | Yes | Yes |
| SQL queries (`storage.sql`) | Yes | No |
| Point-in-time recovery | Yes | No |
| Alarms | Yes | Yes |

Pick a backend based on the shape of your data. Reach for SQL when you need relational tables, queries across many rows, indexes, or aggregation. The key-value API is enough when you store a handful of independent values keyed by name, such as a counter or a session record.

You select the SQLite backend in your migration with `new_sqlite_classes` instead of `new_classes`:

```jsonc
{
  "migrations": [
    {
      "tag": "v1",
      // new_sqlite_classes opts the class into the SQLite backend;
      // new_classes would create a key-value-only class instead
      "new_sqlite_classes": ["Counter"]
    }
  ]
}
```

::warning
A class's backend is permanent. You cannot switch an existing class between backends, so choose before your first deploy.
::

### Reading and writing key-value data

Both backends expose the same asynchronous key-value API. Values are addressed by name, with no namespace IDs or bindings.

```ts
// Write a value
await this.ctx.storage.put('score', 42)

// Read a value (returns undefined if the key doesn't exist)
const score = await this.ctx.storage.get<number>('score')

// Read multiple keys at once, returning a Map
const data = await this.ctx.storage.get<number>(['score', 'level'])
const score = data.get('score')
const level = data.get('level')

// Delete a key
await this.ctx.storage.delete('score')
```

All values are serialised automatically. You can store strings, numbers, booleans, arrays, and plain objects without calling `JSON.stringify`.

### Listing keys

Use `list()` to iterate over stored entries. It returns a `Map` in sorted key order.

```ts
const entries = await this.ctx.storage.list<number>()
for (const [key, value] of entries) {
  console.log(key, value)
}
```

You can filter the results with options:

```ts
// Keys that start with "user:"
const users = await this.ctx.storage.list({ prefix: 'user:' })

// First 10 keys alphabetically
const first = await this.ctx.storage.list({ limit: 10 })
```

### Querying with SQL

On the SQLite backend, `this.ctx.storage.sql` runs SQL against the object's embedded database. Create tables in the constructor so they exist before the first request:

```ts
export class Chatroom extends DurableObject {
  sql: SqlStorage

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    this.sql = ctx.storage.sql

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id      INTEGER PRIMARY KEY,
        author  TEXT,
        body    TEXT,
        sent_at INTEGER
      )
    `)
  }
}
```

`exec()` returns a cursor you can iterate over directly, or collect with `toArray()`. Use `?` placeholders for values rather than string concatenation, which keeps queries safe from injection:

```ts
this.sql.exec(
  'INSERT INTO messages (author, body, sent_at) VALUES (?, ?, ?)',
  author,
  body,
  Date.now(),
)

const recent = this.sql
  .exec('SELECT * FROM messages ORDER BY sent_at DESC LIMIT 50')
  .toArray()
```

Queries run synchronously and count rows read and written for billing, so indexes on frequently filtered columns pay off in read-heavy workloads.

::info
The SQL API is only available on the SQLite backend. Calling `ctx.storage.sql` on a key-value-backed class throws an error.
::

### Transactions

Durable Objects process requests one at a time, so a simple read-then-write is already safe. For multiple reads and writes that must succeed or fail together, use a transaction:

```ts
await this.ctx.storage.transaction(async (txn) => {
  const balance = (await txn.get<number>('balance')) ?? 0
  if (balance < amount) throw new Error('Insufficient funds')
  await txn.put('balance', balance - amount)
})
```

If the callback throws, all writes inside it are rolled back.

::info
Transactions in Durable Objects are serialised. Only one transaction can run at a time per object, and they commit to durable storage before the object processes another request.
::

### In-memory caching

Storage reads involve a small amount of I/O. If you access the same values on every request, you can cache them in the object's instance variables. Instance variables survive between requests as long as the object stays loaded in memory.

```ts
export class Counter extends DurableObject {
  private count: number | undefined

  async fetch(request: Request): Promise<Response> {
    // Load from storage only on the first request
    if (this.count === undefined) {
      this.count = (await this.ctx.storage.get<number>('count')) ?? 0
    }

    this.count++
    await this.ctx.storage.put('count', this.count)

    return new Response(`Visits: ${this.count}`)
  }
}
```

Don't rely on instance variables for correctness. Cloudflare can evict an idle object at any time, clearing them. Always write the authoritative value to storage.

### Alarms

An alarm lets a Durable Object wake itself up at a scheduled time, even when no request comes in. Use it for cleanup tasks, timeouts, or scheduled processing.

```ts
export class Session extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    // Schedule an alarm 10 minutes from now
    await this.ctx.storage.setAlarm(Date.now() + 10 * 60 * 1000)
    return new Response('Session started')
  }

  async alarm(): Promise<void> {
    // This runs when the alarm fires
    await this.ctx.storage.deleteAll()
  }
}
```

Only one alarm can be scheduled at a time per object. Calling `setAlarm` again replaces the previous one. You can cancel it with `deleteAlarm()`.

### Deleting all data

To wipe an object's storage completely:

```ts
await this.ctx.storage.deleteAll()
```

This is permanent. Use it when retiring an object, such as when a user deletes their account or a game room closes.
