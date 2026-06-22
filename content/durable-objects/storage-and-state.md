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

Select the SQLite backend in your migration with `new_sqlite_classes` instead of `new_classes`:

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

// Returns undefined if the key doesn't exist.
const score = await this.ctx.storage.get<number>('score')

// Read multiple keys at once, returning a Map.
const data = await this.ctx.storage.get<number>(['score', 'level'])
const score = data.get('score')
const level = data.get('level')

await this.ctx.storage.delete('score')
```

Values are serialised automatically. You can store strings, numbers, booleans, arrays, and plain objects without calling `JSON.stringify`.

### Listing keys

Use `list()` to iterate over stored entries. It returns a `Map` in sorted key order.

```ts
const entries = await this.ctx.storage.list<number>()
for (const [key, value] of entries) {
  console.log(key, value)
}
```

Filter the results with options:

```ts
const users = await this.ctx.storage.list({ prefix: 'user:' })

const first = await this.ctx.storage.list({ limit: 10 })
```

### Querying with SQL

The key-value API is a poor fit once you need to rank, filter, or aggregate across many records. A leaderboard is the classic case: you store a score per player, then ask "who are the top ten?" on every read. With key-value you'd load every entry and sort in memory; with SQL the database does it.

On the SQLite backend, `this.ctx.storage.sql` runs SQL against the object's embedded database. Create tables in the constructor so they exist before the first request:

```ts
export class Leaderboard extends DurableObject {
  sql: SqlStorage

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    this.sql = ctx.storage.sql

    // An index on score turns the top-N query below into a
    // range scan instead of a full-table sort on every read.
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS scores (
        player TEXT PRIMARY KEY,
        score  INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS scores_by_value ON scores (score DESC);
    `)
  }
}
```

`exec()` returns a cursor you can iterate over directly, or collect with `toArray()`. Bind values with `?` placeholders rather than building query strings, which keeps untrusted input out of the SQL text:

```ts
// Upsert: record a new score or replace the player's old one.
this.sql.exec(
  `INSERT INTO scores (player, score) VALUES (?, ?)
   ON CONFLICT(player) DO UPDATE SET score = excluded.score`,
  player,
  points,
)

const top = this.sql
  .exec('SELECT player, score FROM scores ORDER BY score DESC LIMIT 10')
  .toArray()
```

Aggregates work the same way, so a single query can answer questions the key-value API can't express directly:

```ts
const rank = this.sql
  .exec('SELECT count(*) + 1 AS rank FROM scores WHERE score > ?', myScore)
  .one()
```

::info
The SQL API is only available on the SQLite backend. Calling `ctx.storage.sql` on a key-value-backed class throws an error.
::

### Transactions

Because an object handles one request at a time, a plain read-then-write is already safe from interference. A transaction adds a second guarantee: a group of writes either all land or none do. That matters when one logical change touches several keys and a half-applied result would be wrong.

Reserving an item from limited stock is a good fit. You decrement the remaining quantity and record who holds it, and you never want one without the other:

```ts
await this.ctx.storage.transaction(async (txn) => {
  const remaining = (await txn.get<number>('remaining')) ?? 0
  if (remaining === 0) throw new Error('Out of stock')

  await txn.put('remaining', remaining - 1)
  await txn.put(`hold:${customerId}`, Date.now())
  // Throwing anywhere above rolls back both writes, so stock is
  // never decremented without a matching hold recorded.
})
```

::info
Transactions are serialised per object and commit to disk before the object handles another request. Only one runs at a time.
::

### Caching in memory

An object keeps its instance variables for as long as it stays loaded, so a value you've already read can be served from a field instead of going back to storage. For a hot value read on every request, that removes a storage round trip from the common path:

```ts
export class Leaderboard extends DurableObject {
  private topCache: { player: string; score: number }[] | undefined

  async top(): Promise<{ player: string; score: number }[]> {
    // Any write that changes the ranking must reset topCache,
    // or stale data will be served until the object is evicted.
    if (this.topCache === undefined) {
      this.topCache = this.sql
        .exec('SELECT player, score FROM scores ORDER BY score DESC LIMIT 10')
        .toArray() as { player: string; score: number }[]
    }
    return this.topCache
  }
}
```

::warning
Instance variables vanish when the object is evicted, so they are a cache, not a record. Treat storage as the source of truth and reload from it after eviction.
::

### Alarms

An alarm wakes an object at a scheduled time even when no request arrives. That fills a gap the request-driven model leaves open: work that must happen *later*, with nothing prompting it.

The stock hold from earlier is a natural example. A reservation shouldn't last forever, so set an alarm when the hold is taken and release it when the alarm fires:

```ts
export class Inventory extends DurableObject {
  async reserve(customerId: string): Promise<void> {
    await this.ctx.storage.put(`hold:${customerId}`, Date.now())

    // Ten minutes to check out before the hold expires and the
    // item returns to available stock.
    await this.ctx.storage.setAlarm(Date.now() + 10 * 60 * 1000)
  }

  async alarm(): Promise<void> {
    const holds = await this.ctx.storage.list({ prefix: 'hold:' })
    for (const key of holds.keys()) {
      await this.ctx.storage.delete(key)
    }
    // Re-add the released holds to the available count here.
  }
}
```

Each object has at most one alarm. Calling `setAlarm` again replaces the pending time, and `deleteAlarm()` cancels it.

### Retiring an object

An object stops existing once its storage is empty when it shuts down. To retire one, clear everything it holds:

```ts
await this.ctx.storage.deleteAll()
```

Deleting individual keys or dropping tables is not enough, since internal metadata can remain and keep the object alive. `deleteAll()` is the only call that empties storage completely, which is what you'd run when a season's leaderboard closes or a customer deletes their account.

::warning
If the object has an alarm set, cancel it with `deleteAlarm()` before `deleteAll()`. An outstanding alarm counts as storage and will keep the object from being retired.
::
