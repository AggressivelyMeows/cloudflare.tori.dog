---
title: 'Message history and presence'
category: 'Durable Objects'
description: 'Persist chat messages with SQLite, replay them on join, and track who is in the room.'
storybook: 'chat-app'
author: 'tori'
---

The skeleton from the <Link href="/labs/durable-objects/chat-app">previous page</Link> accepts a socket and opens it. A real chat room does three more things: save every message so latecomers can catch up, send that history to a client the moment they connect, and keep a running head-count of who's online.

### A table for messages

The `ChatRoom` class uses the SQLite backend (we picked `new_sqlite_classes` in `wrangler.jsonc`), so it has a private database. Create the table in the constructor so it exists before the first message arrives:

```ts
export class ChatRoom extends DurableObject {
  sql: SqlStorage

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    this.sql = ctx.storage.sql

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id    INTEGER PRIMARY KEY AUTOINCREMENT,
        from  TEXT NOT NULL,
        text  TEXT NOT NULL,
        at    INTEGER NOT NULL
      );
    `)

    // Keep the room from growing forever. A rolling window of the
    // last 500 messages is plenty for a tutorial chat app.
    this.sql.exec(`
      DELETE FROM messages WHERE id NOT IN (
        SELECT id FROM messages ORDER BY id DESC LIMIT 500
      );
    `)
  }

  // ...fetch and webSocketMessage handlers below
}
```

`SqlStorage` is a global type provided by `@cloudflare/workers-types`, so no import is needed. The constructor runs once per cold start, so this cleanup is cheap and doesn't fire on every message or connect. The <Link href="/labs/durable-objects/storage-and-state">storage storybook</Link> covers `exec`, bound parameters, and the difference between the SQLite and key-value backends. The table is per-room: each room is its own object with its own database.

### Sending history on connect

When a client opens a socket, send them everything they missed before they start sending messages of their own. Do this in `fetch`, right after accepting the connection:

```ts
export class ChatRoom extends DurableObject {
  // Code from previous steps.
  constructor(ctx: DurableObjectState, env: Env) { ... }

  async fetch(request: Request): Promise<Response> {
    const { 0: client, 1: server } = new WebSocketPair()
    this.ctx.acceptWebSocket(server)

    // Replay recent messages to the newcomer only.
    const recent = this.sql.exec('SELECT from, text, at FROM messages ORDER BY id DESC LIMIT 50').toArray().reverse()
    server.send(JSON.stringify({ type: 'history', messages: recent }))

    return new Response(null, { status: 101, webSocket: client })
  }
}
```

History goes to `server`, the server end of the pair, not to the whole room. It's a private catch-up, not a broadcast. The `.reverse()` flips the descending query back into chronological order for display.

### Handling an incoming message

`webSocketMessage` fires once per message from any client. Parse the <Link href="/labs/durable-objects/chat-app#a-message-protocol">protocol</Link>, store the message, then fan it out to every socket in the room:

```ts
export class ChatRoom extends DurableObject {
  // Code from previous steps.
  constructor(ctx: DurableObjectState, env: Env) { ... }
  async fetch(request: Request): Promise<Response> { ... }

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
    const msg = JSON.parse(message.toString()) as ClientMessage

    if (msg.type === 'join') {
      // Tag the socket with the username so later handlers know who spoke.
      // Tags are explained in the WebSockets storybook.
      this.ctx.setTags(ws, [msg.name])

      this.broadcast({ type: 'event', kind: 'join', name: msg.name })
      this.announcePresence()
      return
    }

    if (msg.type === 'message') {
      const [from] = this.ctx.getTags(ws)
      if (!from) return // Ignore messages from sockets that haven't joined yet.
      const at = Date.now()

      // Persist before delivering. If the object hibernates between
      // messages, the row is already safely on disk.
      this.sql.exec('INSERT INTO messages (from, text, at) VALUES (?, ?, ?)', from, msg.text, at)

      this.broadcast({ type: 'message', from, text: msg.text, at })
    }
  }
}
```

`broadcast` is a small helper that walks the room roster. The <Link href="/labs/durable-objects/websockets">WebSockets storybook</Link> introduced `getWebSockets()` as the fan-out primitive; here it's wrapped so every send goes through one place:

```ts
export class ChatRoom extends DurableObject {
  // Code from previous steps.
  constructor(ctx: DurableObjectState, env: Env) { ... }
  async fetch(request: Request): Promise<Response> { ... }
  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void { ... }

  private broadcast(payload: ServerMessage): void {
    const data = JSON.stringify(payload)
    for (const socket of this.ctx.getWebSockets()) {
      socket.send(data)
    }
  }
}
```

### Presence

A head-count is the simplest useful presence signal. Recompute it whenever someone joins or leaves and push the new number to everyone:

```ts
export class ChatRoom extends DurableObject {
  // Code from previous steps.
  constructor(ctx: DurableObjectState, env: Env) { ... }
  async fetch(request: Request): Promise<Response> { ... }
  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void { ... }
  private broadcast(payload: ServerMessage): void { ... }

  private announcePresence(): void {
    this.broadcast({ type: 'presence', count: this.ctx.getWebSockets().length })
  }
}
```

### Saying goodbye

When a socket closes, tell the room that person left and update the count. `webSocketClose` is the counterpart to the join event:

```ts
export class ChatRoom extends DurableObject {
  // Code from previous steps.
  constructor(ctx: DurableObjectState, env: Env) { ... }
  async fetch(request: Request): Promise<Response> { ... }
  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void { ... }
  private broadcast(payload: ServerMessage): void { ... }
  private announcePresence(): void { ... }

  webSocketClose(ws: WebSocket, code: number, reason: string): void {
    const [name] = this.ctx.getTags(ws)
    if (name) {
      this.broadcast({ type: 'event', kind: 'leave', name })
    }
    this.announcePresence()
  }
}
```

The `code` and `reason` arguments match the skeleton on the previous page; the runtime passes them in but this handler doesn't use them. Calling `ws.close()` here is unnecessary, the runtime closes the socket regardless. The browser page that renders all of this is covered in <Link href="/labs/durable-objects/chat-client">The chat client</Link>.
