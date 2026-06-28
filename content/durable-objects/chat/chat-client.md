---
title: 'The chat client'
category: 'Durable Objects'
description: 'Build a browser client that connects to the ChatRoom, renders history, and displays live messages.'
storybook: 'chat-app'
author: 'tori'
---

The server accepts sockets, saves messages, and broadcasts. Now we need a page a browser can open. The Worker returns this as a single HTML string from its `fetch` handler, so it's one file with no build step.

### The page

The full client. It picks a username, opens a WebSocket to the current room, and renders each <Link href="/labs/durable-objects/chat-app#a-message-protocol">protocol message</Link> as it arrives:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Chat</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 2rem auto; padding: 0 1rem; }
    #messages { list-style: none; padding: 0; height: 60vh; overflow-y: auto; border: 1px solid #ddd; border-radius: 8px; }
    #messages li { padding: .5rem .75rem; border-bottom: 1px solid #eee; }
    #messages li.event { color: #888; font-style: italic; }
    #presence { color: #666; font-size: .9rem; margin: .5rem 0; }
    form { display: flex; gap: .5rem; margin-top: .5rem; }
    input { flex: 1; padding: .5rem; border: 1px solid #ddd; border-radius: 8px; }
    button { padding: .5rem 1rem; border: none; border-radius: 8px; background: #1a73e8; color: white; cursor: pointer; }
  </style>
</head>
<body>
  <h1>Chat room: <span id="room"></span></h1>
  <div id="presence">0 online</div>
  <ul id="messages"></ul>
  <form id="form">
    <input id="text" placeholder="Type a message…" autocomplete="off" />
    <button>Send</button>
  </form>

  <script>
    const room = location.pathname.split('/').filter(Boolean)[1] ?? 'lobby'
    document.getElementById('room').textContent = room

    const name = prompt('Your name?') ?? 'anonymous'

    const ws = new WebSocket(`/chat/${room}?user=${encodeURIComponent(name)}`)
    const list = document.getElementById('messages')
    const presence = document.getElementById('presence')

    function addLine(text, cls) {
      const li = document.createElement('li')
      li.textContent = text
      if (cls) li.className = cls
      list.appendChild(li)
      list.scrollTop = list.scrollHeight
    }

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)

      switch (msg.type) {
        case 'history':
          for (const m of msg.messages) {
            addLine(`${m.from}: ${m.text}`)
          }
          break
        case 'message':
          addLine(`${msg.from}: ${msg.text}`)
          break
        case 'event':
          addLine(`${msg.name} ${msg.kind}ed the room`, 'event')
          break
        case 'presence':
          presence.textContent = `${msg.count} online`
          break
      }
    }

    document.getElementById('form').addEventListener('submit', (e) => {
      e.preventDefault()
      const input = document.getElementById('text')
      if (!input.value.trim()) return
      ws.send(JSON.stringify({ type: 'message', text: input.value }))
      input.value = ''
      input.focus()
    })

    // Announce ourselves once the socket is open. This fires before any
    // onmessage callback, because the socket must open before messages arrive.
    ws.onopen = () => ws.send(JSON.stringify({ type: 'join', name }))
  </script>
</body>
</html>
```

### How the pieces fit

The client speaks the same `ClientMessage` / `ServerMessage` shapes the server uses. A `switch` on `type` mirrors the server's handler, so both sides stay in lockstep.

<mermaid>
sequenceDiagram
    participant B as Browser
    participant W as Worker
    participant DO as ChatRoom

    B->>W: GET /chat/lobby
    W-->>B: HTML page
    B->>W: WebSocket upgrade
    W->>DO: idFromName("lobby")
    DO-->>B: 101 Switching Protocols
    DO-->>B: { type: "history", messages }
    B->>DO: { type: "join", name }
    DO-->>B: { type: "event", kind: "join" }
    DO-->>B: { type: "presence", count }
    B->>DO: { type: "message", text }
    DO->>DO: INSERT INTO messages
    DO-->>B: { type: "message", from, text }
</mermaid>

### Run it

From the project root, run `npx wrangler dev` to start the Worker locally. Open `http://localhost:8787/chat/lobby` in two browser tabs. Pick different names, send a message from one, and watch it appear in the other. Close a tab and the room announces the departure. Open a third tab later and the history you missed is already waiting.

### Where to next

Private messages use <Link href="/labs/durable-objects/websockets#tagging-a-socket-with-identity">socket tags</Link>, scheduled cleanups use <Link href="/labs/durable-objects/storage-and-state#alarms">alarms</Link>, and the rest of the Durable Object primitives are in the <Link href="/labs/durable-objects/what-are-durable-objects">Durable Objects storybook</Link>.
