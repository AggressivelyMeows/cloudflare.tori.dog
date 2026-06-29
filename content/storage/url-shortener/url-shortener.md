---
title: 'Building a URL shortener'
category: 'Storage'
description: 'Store short links in a D1 database and redirect visitors with a Worker.'
storybook: 'url-shortener'
author: 'tori'
---

A URL shortener takes a long URL, gives it a short slug, and redirects anyone who visits the slug back to the original. Two operations: create a link, follow a link. Both need somewhere to look the slug up.

<a class="tori-glossary-link" href="?glossary=d1">D1</a> is a good fit here. The data is relational (a table of slugs and URLs), writes happen when someone creates a link, and reads happen on every redirect. Because the slug is the primary key, the database itself rejects duplicate slugs, so we don't have to check for collisions in application code.

### What we're building

One Worker handles two routes. `POST /` creates a new short link and returns its slug. `GET /:slug` looks the slug up in D1 and redirects to the stored URL, where `:slug` is whatever short code was generated (for example, `GET /tor`). Everything else returns a 404.

<mermaid>
flowchart TD
    Client["Browser"] -->|"POST / { url }"| W["Worker"]
    Client -->|"GET /tor"| W
    W -->|"INSERT INTO links"| D1[("D1: links table")]
    W -->|"SELECT url WHERE slug"| D1
    W -->|"302 Location: url"| Client
</mermaid>

### Wire up the project

If you're starting fresh, run `npm create cloudflare@latest` from a terminal and pick a TypeScript Worker. The [Your first Worker](/labs/workers-intro/first-worker) Lab covers the basics.

### Create the database

Create a D1 database called `url-shortener`:

```bash
npx wrangler d1 create url-shortener
```

Wrangler prints a `database_id`. Copy it; you'll need it for `wrangler.jsonc` in a moment.

::info
If your project was scaffolded with `wrangler.toml` instead of `wrangler.jsonc`, the same settings apply in TOML syntax. The [Wrangler Configuration](/labs/wrangler/configuration) Lab covers both formats.
::

::warning
Database names are unique within your account. If `url-shortener` is taken, pick another name and use it consistently throughout this storybook.
::

### Configure the binding

Open `wrangler.jsonc` and add a `d1_databases` section. The scaffolder may already have placed starter content in this file; merge the new section in rather than overwriting what's there:

```jsonc
{
  "name": "url-shortener",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-01",

  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "url-shortener",
      "database_id": "your-database-id"
    }
  ]
}
```

The `binding` is the name your Worker uses to reach the database (`env.DB`). The `database_id` is the value Wrangler printed above. The [Wrangler Configuration](/labs/wrangler/configuration) Lab covers bindings in more detail.

### Create the schema

D1 needs a table before you can insert anything. Wrangler runs SQL files against your database, so create `schema.sql` at the project root:

```sql
CREATE TABLE IF NOT EXISTS links (
  slug TEXT PRIMARY KEY,
  url  TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_links_url ON links(url);
```

`slug` is the primary key, so duplicate slugs are rejected by the database itself. The index on `url` makes "has this URL already been shortened?" lookups cheap; you'll see that query on the next page.

Apply it locally first, then remotely when you deploy:

```bash
npx wrangler d1 execute url-shortener --local --file=schema.sql
npx wrangler d1 execute url-shortener --remote --file=schema.sql
```

`--local` writes to the SQLite file Wrangler uses for `wrangler dev`. `--remote` runs the same SQL against your actual D1 database.

### The Env type

Declare an `Env` interface so TypeScript knows what `env.DB` is:

```ts
interface Env {
  DB: D1Database
}
```

`D1Database` is a type only, not runtime code. It's provided globally by `@cloudflare/workers-types`, so no import is needed. Put it at the top of `src/index.ts` or in a separate `env.d.ts` file.

The next page covers [creating short links](/labs/storage/url-shortener/creating-links). The page after that covers [redirecting visitors](/labs/storage/url-shortener/redirecting-visitors).
