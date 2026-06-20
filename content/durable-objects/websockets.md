---
title: 'Real-time connections with WebSockets'
category: 'Durable Objects'
description: 'Use Durable Objects to manage WebSocket connections and broadcast messages to multiple clients.'
storybook: 'durable-objects'
author: 'tori'
---

A Worker can accept a WebSocket connection, but it can't communicate with other Workers handling other connections. Broadcasting to a chat room requires all connections to share the same in-memory socket list, which is only possible inside a single Durable Object instance.

### Accepting a WebSocket connection

Call `this.ctx.acceptWebSocket(server)` to hand the socket to the Durable Object runtime. The runtime then manages the connection and calls your event handlers automatically.

```ts
import { DurableObject } from 'cloudflare:workers'

export class ChatRoom extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    // Upgrade the HTTP request to a WebSocket connection
    const { 0: client, 1: server } = new WebSocketPair()

    // Let the runtime manage this socket
    this.ctx.acceptWebSocket(server)

    return new Response(null, { status: 101, webSocket: client })
  }

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
    // Broadcast the message to every connected socket
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

`this.ctx.getWebSockets()` returns all sockets currently accepted by this object. Iterating over them and calling `send` is how you broadcast.

### Routing requests to the right room

Each room should be its own Durable Object instance. The Worker picks the right instance based on the room name in the URL.

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

`idFromName(roomName)` is deterministic. Two Workers that call `idFromName('lobby')` always get the same object.

### Storing metadata on a socket

You can attach arbitrary data to a socket when you accept it. This is useful for tracking which user a socket belongs to.

```ts
async fetch(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const username = url.searchParams.get('user') ?? 'anonymous'

  const { 0: client, 1: server } = new WebSocketPair()

  // Attach the username so you can read it later
  this.ctx.acceptWebSocket(server, { tags: [username] })

  return new Response(null, { status: 101, webSocket: client })
}

webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
  // Read the tag to find out who sent the message
  const [username] = this.ctx.getTags(ws)
  const payload = JSON.stringify({ from: username, message })

  for (const socket of this.ctx.getWebSockets()) {
    socket.send(payload)
  }
}
```

### Hibernation

Without hibernation, a Durable Object with open sockets stays loaded in memory even when idle. With the hibernation API (used by `acceptWebSocket` by default), Cloudflare unloads the object between messages and reloads it on the next message, reducing memory usage for long-lived connections.

Your object's instance variables don't survive hibernation, so keep any state you need in `this.ctx.storage`.

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
