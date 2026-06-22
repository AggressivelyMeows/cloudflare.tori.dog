---
title: 'Real-time connections with WebSockets'
category: 'Durable Objects'
description: 'Use Durable Objects to manage WebSocket connections and broadcast messages to multiple clients.'
storybook: 'durable-objects'
author: 'tori'
---

A chat room, a live document, a multiplayer lobby: each one has the same shape. Many clients hold open connections, and a message from any one of them has to reach some or all of the others. The hard part is that separate connections can be handled by separate Worker invocations that share nothing, so there's no list of "everyone in the room" to broadcast to.

A Durable Object gives you that list. Point every connection for a room at the same object and it holds all of those sockets together, so one message can fan out to the whole room.

<mermaid>
flowchart TD
    C1["Client A"] <--> DO
    C2["Client B"] <--> DO
    C3["Client C"] <--> DO

    DO["ChatRoom object (holds all sockets)"]
    DO -. broadcast .-> C1
    DO -. broadcast .-> C2
    DO -. broadcast .-> C3
</mermaid>

### Accepting a WebSocket connection

Hand each socket to the runtime with `this.ctx.acceptWebSocket(server)`. The runtime tracks the connection and invokes your `webSocketMessage`, `webSocketClose`, and `webSocketError` handlers as events arrive.

```ts
import { DurableObject } from 'cloudflare:workers'

export class ChatRoom extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const { 0: client, 1: server } = new WebSocketPair()

    // Handing the socket to the runtime (rather than calling
    // server.accept() ourselves) opts the connection into
    // hibernation, so the object can be unloaded between messages.
    this.ctx.acceptWebSocket(server)

    // 101 Switching Protocols returns the client end to the browser.
    return new Response(null, { status: 101, webSocket: client })
  }

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
    // getWebSockets() is the room roster; iterating it is the fan-out.
    for (const socket of this.ctx.getWebSockets()) {
      socket.send(message)
    }
  }

  webSocketClose(ws: WebSocket): void {
    ws.close()
  }

  webSocketError(ws: WebSocket, error: unknown): void {
    ws.close()
  }
}
```

### Routing connections to a room

Give each room its own object by naming it after the room. Every client that joins `lobby` resolves to the same instance and therefore the same socket roster:

```ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const roomName = url.searchParams.get('room') ?? 'default'

    const id = env.CHAT_ROOM.idFromName(roomName)
    const room = env.CHAT_ROOM.get(id)

    return room.fetch(request)
  },
}

interface Env {
  CHAT_ROOM: DurableObjectNamespace
}
```

The naming guarantee behind `idFromName` is covered in [What are Durable Objects?](/labs/durable-objects/what-are-durable-objects). The practical effect here: separate rooms get separate objects, so a busy `lobby` never slows down a quiet `support` room.

### Tagging a socket with identity

The `webSocketMessage` handler receives the socket but no context about who owns it. Attach tags when you accept the connection, and the handler can recover that context without a separate lookup:

```ts
async fetch(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const username = url.searchParams.get('user') ?? 'anonymous'

  const { 0: client, 1: server } = new WebSocketPair()

  // Tags survive hibernation, so identity is available on every
  // later message without a socket-to-user map kept in storage.
  this.ctx.acceptWebSocket(server, { tags: [username] })

  return new Response(null, { status: 101, webSocket: client })
}

webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
  const [username] = this.ctx.getTags(ws)
  const payload = JSON.stringify({ from: username, message })

  for (const socket of this.ctx.getWebSockets()) {
    socket.send(payload)
  }
}
```

Tags also let you address a subset of the room. `getWebSockets(tag)` returns only the sockets carrying that tag, which is how you'd send a private message or push a cursor position to everyone editing the same paragraph of a shared document.

### Hibernation

Without hibernation, a Durable Object with open sockets stays loaded in memory even when idle. With the hibernation API (used by `acceptWebSocket` by default), Cloudflare unloads the object between messages and reloads it on the next message, reducing memory usage for long-lived connections.

Instance variables don't survive hibernation, so keep any state you need in `this.ctx.storage`.

::info
The hibernation API is what you get when you call `this.ctx.acceptWebSocket`. The older pattern of calling `ws.accept()` directly does not hibernate and keeps the object in memory continuously.
::

### Adding this to `wrangler.jsonc`

```jsonc
{
  "durable_objects": {
    "bindings": [
      {
        "name": "CHAT_ROOM",
        "class_name": "ChatRoom"
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "new_classes": ["ChatRoom"]
    }
  ]
}
```

The `ChatRoom` class can be extended with persistent message history, user lists, or moderation logic using `this.ctx.storage`.
