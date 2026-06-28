---
title: 'Building a chat app'
category: 'Durable Objects'
description: 'Combine a Durable Object, WebSockets, and storage into a real-time chat app with rooms.'
storybook: 'chat-app'
author: 'tori'
---

You've seen a Durable Object store a value and accept a WebSocket connection. This storybook combines those two ideas into a multi-room chat: people pick a name, join a room, see each other's messages appear live, and catch up on what they missed.

It assumes you've read the [Durable Objects storybook](/labs/durable-objects/what-are-durable-objects). What an object is, how `idFromName` routes, and how `acceptWebSocket` hibernates are covered there. The parts a chat app needs on top: a message format, saved history, and a client UI.

### What we're building

One Worker does two jobs. For browser requests, it serves a small HTML page. For WebSocket upgrades, it hands the connection to a `ChatRoom` object, the one whose name matches the room in the URL. Each room is its own object, so `lobby` and `support` never share state or slow each other down.

<mermaid>
flowchart TD
    Browser["Browser"] -->|GET /chat/lobby| W["Worker"]
    Browser <-. WebSocket upgrade .-> W
    W -->|idFromName lobby| DO["ChatRoom object for lobby"]
    W -->|serve HTML| Browser
    DO <-. messages .-> Browser
</mermaid>

### A message protocol

A WebSocket is just a pipe. When a message arrives, the server sees a string of bytes with no built-in way to know whether those bytes are someone saying "hello", someone joining a room, or the server announcing that a person left. We have to define that meaning ourselves, the next paragraph shows how.

The simplest approach is to send plain text and treat every message as chat. That works for a toy, but a real chat app needs to distinguish between different *kinds* of event: a person joining, a person sending a message, the server replaying old messages, the server telling everyone how many people are online. If everything is a bare string, you end up parsing meaning out of the text itself, which gets messy fast.

The fix is to give every message a `type` field: a label that says "I am a join" or "I am a chat message". The rest of the message's shape follows from that label. Here's the protocol we'll use:

```ts
// Client → server
type ClientMessage =
  | { type: 'join'; name: string }       // "I'm joining as <name>"
  | { type: 'message'; text: string }    // "Here's something I want to say"

// Server → client
type ServerMessage =
  | { type: 'history'; messages: StoredMessage[] }              // "Here's what you missed"
  | { type: 'message'; from: string; text: string; at: number } // "<from> said <text> at <time>"
  | { type: 'event'; kind: 'join' | 'leave'; name: string }    // "<name> joined/left"
  | { type: 'presence'; count: number }                        // "There are <count> people here"

// A single saved chat message, stored in the Durable Object's database.
type StoredMessage = { from: string; text: string; at: number }
```

#### What is this code, and why are we writing it?

These are **TypeScript type definitions**. They don't run at runtime; they describe the *shape* of the data that flows between the browser and the Worker. Think of them as a contract: any message the client sends will match one of the `ClientMessage` shapes, and any message the server sends will match one of the `ServerMessage` shapes.

We write them for three reasons:

1. **To document the protocol.** Anyone reading the code can see exactly what kinds of messages are allowed, and what fields each one carries, without hunting through the handler code.
2. **To catch mistakes.** If the server tries to send `{ type: 'mesage', text: 'hi' }` (note the typo), TypeScript will refuse to compile. The type acts as a guardrail.
3. **To make the handler code simpler.** Each message is what TypeScript calls a *discriminated union*, a set of shapes that all share one field (`type`) that lets TypeScript figure out which variant it's looking at. When the handler does `switch (msg.type)`, TypeScript knows that inside the `case 'join'` branch, `msg` has a `name` field, and inside the `case 'message'` branch, `msg` has a `text` field. The narrowing happens for free.

The same shapes are used on the client, so there's one source of truth for what crosses the wire.

::info
Keep the protocol in a shared file (e.g. `src/protocol.ts`) and import it from both the Worker and any build step for the client. Drift between the two sides, where the server expects one shape and the client sends another, is the most common bug in a hand-rolled chat app. A shared file makes it impossible.
::

### Wire up the project

If you're starting fresh, run `npm create cloudflare@latest` from a terminal and pick a TypeScript Worker. The [first Durable Object](/labs/durable-objects/first-durable-object) Lab walks through `wrangler.jsonc`, migrations, and the `Env` type in more detail. The configuration for the `ChatRoom` class:

```jsonc
{
  "name": "chat-app",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-01",

  "durable_objects": {
    "bindings": [
      { "name": "CHAT_ROOM", "class_name": "ChatRoom" }
    ]
  },

  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["ChatRoom"] }
  ]
}
```

- **`durable_objects.bindings`** wires the `ChatRoom` class into the Worker under the name `CHAT_ROOM`. From inside the Worker's `fetch` handler, you access it as `env.CHAT_ROOM`. The binding is the bridge between a TypeScript class you wrote and a thing the runtime knows how to spin up and route requests to.
- **`migrations`** tells Cloudflare how to set up storage for the class the first time it's deployed. `new_sqlite_classes` means "give every instance of `ChatRoom` its own SQLite database." A chat room has to remember its message history even when no one is connected; without storage, the conversation would vanish the moment the object is evicted from memory. The `tag: 'v1'` is just a label for this migration. If you ever add another class later, you'd add a `v2` migration with a new tag, and Cloudflare runs them in order, once each. The [storage storybook](/labs/durable-objects/storage-and-state) covers why that storage is permanent.

### The Worker's fetch handler

The Worker is the entry point for *every* request, both regular browser page loads and WebSocket connection upgrades. It looks at each request, decides which kind it is, and routes it to the right place:

```ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // WebSocket upgrades carry the Upgrade header.
    if (request.headers.get('Upgrade') === 'websocket') {
      // /chat/lobby → room name "lobby"
      const roomName = url.pathname.split('/').filter(Boolean)[1] ?? 'lobby'
      const id = env.CHAT_ROOM.idFromName(roomName)
      return env.CHAT_ROOM.get(id).fetch(request)
    }

    return new Response(HTML_PAGE, {
      headers: { 'content-type': 'text/html;charset=utf-8' },
    })
  },
}

interface Env {
  CHAT_ROOM: DurableObjectNamespace
}
```

Let's walk through what each part does and why:

- **`async fetch(request, env)`**: this is the Worker's main handler. Every request to the Worker hits this function. The `env` argument carries the bindings from `wrangler.jsonc`, which is how `CHAT_ROOM` shows up here.
- **The `Upgrade` header check**: when a browser wants to open a WebSocket, it sends an HTTP request with `Upgrade: websocket`. Regular page loads don't have that header, so it's a reliable way to tell the two apart.
- **`url.pathname.split('/').filter(Boolean)[1]`**: pulls the room name out of the URL. For `/chat/lobby`, index 0 is the `chat` segment and `[1]` gives `lobby`. The `filter(Boolean)` drops the empty strings that come from leading/trailing slashes, and the `?? 'lobby'` provides a default so a bare `/chat/` still works.
- **`env.CHAT_ROOM.idFromName(roomName)`**: turns the room name into a Durable Object ID. The same name always produces the same ID, so everyone who visits `/chat/lobby` lands in the same `ChatRoom` object. Different names (`lobby`, `support`, `random`) map to different objects with completely separate state.
- **`env.CHAT_ROOM.get(id).fetch(request)`**: `get(id)` returns a stub for that specific object, and `.fetch(request)` forwards the original request to it. The object then handles the WebSocket handshake itself.
- **The `Env` interface**: a TypeScript type that tells the Worker what bindings exist. Without it, `env.CHAT_ROOM` would be `any` and you'd get no autocomplete or type checking. `DurableObjectNamespace` is the type Cloudflare provides for a Durable Object binding.

The `HTML_PAGE` string is built in [The chat client](/labs/durable-objects/chat-client). The room name comes from the URL path, so each room is addressable as `/chat/<room>`.

### The ChatRoom skeleton

Here's the class shell. The [WebSockets storybook](/labs/durable-objects/websockets) explains `acceptWebSocket` and hibernation in detail.

```ts
import { DurableObject } from 'cloudflare:workers'

export class ChatRoom extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const { 0: client, 1: server } = new WebSocketPair()
    this.ctx.acceptWebSocket(server)
    return new Response(null, { status: 101, webSocket: client })
  }

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
    // Filled in on the next page.
  }

  webSocketClose(ws: WebSocket, code: number, reason: string): void {
    // Filled in on the next page.
  }
}
```

A Durable Object is just a class that extends `DurableObject` from `cloudflare:workers`. The same room name always reaches the same instance, and the object has a place to store data (the SQLite database from the migration). The methods on it are the hooks the runtime calls when something happens:

- **`fetch(request)`**: called when the Worker forwards a request to this object. For a chat room, that request is always a WebSocket upgrade. The body does three things:
  - Create a `WebSocketPair` (one end for the browser, one for the server).
  - Hand the server end to `acceptWebSocket` so the runtime tracks it and can hibernate the object when idle to save memory.
  - Return the client end to the browser as a `101 Switching Protocols` response.

  After that, the connection is open and messages flow both ways.
- **`webSocketMessage(ws, message)`**: called whenever a connected client sends a message. This is where we'll parse the `ClientMessage`, save chat messages to storage, and broadcast them to everyone else in the room.
- **`webSocketClose(ws, code, reason)`**: called when a client disconnects (closing the tab, losing the network, etc.). This is where we'll announce that someone left and update the presence count.

The message handling goes in [Message history and presence](/labs/durable-objects/chat-history).
