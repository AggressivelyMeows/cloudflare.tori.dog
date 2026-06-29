---
title: 'Storing orders in D1'
category: 'Workers'
description: 'Create a D1 database and schema for food orders and their approval status.'
storybook: 'food-ordering'
author: 'tori'
---

The Workflow coordinates the steps, but the orders themselves need a home that outlives any single instance. A customer should be able to look up their order status hours later, and a manager needs a list of orders waiting for approval. <a class="tori-glossary-link" href="?glossary=d1">D1</a> holds that data in a table the Worker and the Workflow both read from and write to.

### Create the database

Create a D1 database called `food-orders`:

```bash
npx wrangler d1 create food-orders
```

Wrangler prints a `database_id`. Copy it for the next step.

::warning
Database names are unique within your account. If `food-orders` is taken, pick another name and use it consistently throughout this storybook.
::

### Configure the binding

Open `wrangler.jsonc` and add a `d1_databases` section. The scaffolder may already have placed starter content in this file; merge the new section in rather than overwriting what's there:

```jsonc
{
  "name": "food-orders",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-01",

  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "food-orders",
      "database_id": "your-database-id"
    }
  ]
}
```

The `binding` is the name your Worker uses to reach the database (`env.DB`). The [Wrangler Configuration](/labs/wrangler/configuration) Lab covers bindings in more detail.

### The schema

An order has an ID, the items the customer ordered, a total, a status, and timestamps. Create `schema.sql` at the project root:

```sql
CREATE TABLE IF NOT EXISTS orders (
  id          TEXT PRIMARY KEY,
  items       TEXT NOT NULL,
  total       INTEGER NOT NULL,
  status      TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

-- One order can have at most one pending approval, so this index lets the
-- "list orders awaiting approval" query (used on the approval page) scan
-- only the relevant rows.
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
```

`items` is stored as JSON text. D1 has no native array type, so serializing the basket keeps the structure intact without a second table (the alternative would be an `order_items` table with one row per item, joined back to `orders`). `total` is an integer in cents to avoid floating-point rounding on money.

::info
Storing money as an integer of the smallest currency unit (cents, pence) is a standard pattern. `$12.50` becomes `1250`. Never store money as a float; `0.1 + 0.2` is not `0.3` in floating point.
::

Apply the schema locally, then remotely when you deploy:

```bash
npx wrangler d1 execute food-orders --local --file=schema.sql
npx wrangler d1 execute food-orders --remote --file=schema.sql
```

`--local` writes to the SQLite file Wrangler uses for `wrangler dev`. `--remote` runs the same SQL against your actual D1 database.

### The Env type

Declare an `Env` interface so TypeScript knows what `env.DB` is. The Workflow binding will be added on the next page; for now, just the database:

```ts
interface Env {
  DB: D1Database
}
```

`D1Database` is a type only, not runtime code. It's provided globally by `@cloudflare/workers-types`, so no import is needed. Put it at the top of `src/index.ts` or in a separate `env.d.ts` file.

### A helper for order IDs

Each order needs a unique ID before it's inserted. A short random string is enough for a tutorial:

```ts
// Omit ambiguous characters so an ID read aloud or off a receipt
// still resolves.
const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'

function generateId(length = 8): string {
  let id = ''
  for (let i = 0; i < length; i++) {
    id += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return id
}
```

The next page covers [defining the Workflow](/labs/workers/food-ordering/defining-the-workflow) that will read and write these orders.
