# Lunel + OpenCode Integration Plan

## Context

Lunel is a mobile IDE that lets users code on their phone while running code on their desktop machine. The infrastructure already exists: a CLI agent (Node.js) connects to a Gateway relay (Bun WebSocket), which bridges to the Mobile App (Expo/React Native). File system, git, terminal, and other operations work end-to-end.

**What's missing:** The AI Plugin in the mobile app has a beautiful OpenCode-style UI but its `sendMessage` function is a `TODO`. There's no integration with OpenCode (https://opencode.ai), the open-source AI coding agent. The goal is to wire OpenCode SDK into the CLI so the mobile app can send prompts, receive streaming AI responses, manage sessions, handle permissions, and control OpenCode remotely.

**Intended outcome:** A user runs the CLI on their machine, scans the QR code with the Lunel mobile app, and can then use OpenCode's full AI coding capabilities from their phone — sending prompts, seeing streaming responses with inline tool calls and file diffs, approving permissions, switching models/agents, and managing sessions.

---

## Architecture Overview

```
Mobile App (Expo/React Native)
    │
    │ WebSocket (dual: control + data)
    ▼
Gateway Relay (Bun)
    │
    │ WebSocket (dual: control + data)
    ▼
CLI Agent (Node.js)
    │
    │ @opencode-ai/sdk (HTTP + SSE)
    ▼
OpenCode Server (local)
    │
    │ API calls
    ▼
LLM Provider (Anthropic, OpenAI, Google, etc.)
```

---

## Files to Modify

| File | Change |
|------|--------|
| `cli/package.json` | Add `@opencode-ai/sdk` dependency |
| `cli/src/index.ts` | Add OpenCode SDK startup, `ai` namespace handlers, event forwarding, permission handling |
| `gateway/src/index.ts` | Replace hard 10-min TTL with connection-aware session lifecycle |
| `app/hooks/useAI.ts` | **New file** — AI hook for OpenCode communication (follows `useTerminal.ts` pattern) |
| `app/plugins/core/ai/types.ts` | **New file** — TypeScript types for AI/OpenCode data |
| `app/plugins/core/ai/Panel.tsx` | Rewrite to wire real OpenCode data, streaming messages, permissions, commands |

---

## Step 1: CLI — OpenCode SDK Integration

### 1.1 Add SDK Dependency

```bash
cd cli && npm install @opencode-ai/sdk
```

### 1.2 Import and Start OpenCode on CLI Startup

At the top of `cli/src/index.ts`, add:

```typescript
import { createOpencode } from "@opencode-ai/sdk";
```

In `main()`, before creating the gateway session, start OpenCode:

```typescript
async function main(): Promise<void> {
  console.log("Lunel CLI v" + VERSION);
  console.log("=".repeat(20) + "\n");

  // Start OpenCode server + client
  console.log("Starting OpenCode...");
  const { client } = await createOpencode();
  console.log("OpenCode ready.\n");

  // Store client globally for handlers
  opencodeClient = client;

  // Subscribe to OpenCode events (details in 1.5)
  subscribeToOpenCodeEvents(client);

  // Then create gateway session and show QR (existing flow)
  const code = await createSession();
  displayQR(code);
  connectWebSocket(code);
}
```

Add a module-level variable:

```typescript
let opencodeClient: Awaited<ReturnType<typeof createOpencode>>["client"] | null = null;
```

### 1.3 Add `ai` Namespace to Message Router

Add a new case in `processMessage()` switch for `ns === "ai"`:

```typescript
case "ai":
  switch (action) {
    case "prompt":          result = await handleAiPrompt(payload); break;
    case "createSession":   result = await handleAiCreateSession(payload); break;
    case "listSessions":    result = await handleAiListSessions(); break;
    case "getSession":      result = await handleAiGetSession(payload); break;
    case "deleteSession":   result = await handleAiDeleteSession(payload); break;
    case "getMessages":     result = await handleAiGetMessages(payload); break;
    case "abort":           result = await handleAiAbort(payload); break;
    case "agents":          result = await handleAiAgents(); break;
    case "providers":       result = await handleAiProviders(); break;
    case "setAuth":         result = await handleAiSetAuth(payload); break;
    case "command":         result = await handleAiCommand(payload); break;
    case "revert":          result = await handleAiRevert(payload); break;
    case "unrevert":        result = await handleAiUnrevert(payload); break;
    case "share":           result = await handleAiShare(payload); break;
    case "permission":      result = await handleAiPermissionReply(payload); break;
    default:
      throw Object.assign(new Error(`Unknown action: ${ns}.${action}`), { code: "EINVAL" });
  }
  break;
```

Also update `handleSystemCapabilities()` to include `"ai"` in the namespaces array.

### 1.4 Implement AI Handler Functions

Each handler maps directly to an OpenCode SDK method:

**Session Management:**

```typescript
async function handleAiCreateSession(payload: Record<string, unknown>) {
  const title = (payload.title as string) || undefined;
  const response = await opencodeClient!.session.create({ body: { title } });
  return { session: response.data };
}

async function handleAiListSessions() {
  const response = await opencodeClient!.session.list();
  return { sessions: response.data };
}

async function handleAiGetSession(payload: Record<string, unknown>) {
  const id = payload.id as string;
  const response = await opencodeClient!.session.get({ path: { id } });
  return { session: response.data };
}

async function handleAiDeleteSession(payload: Record<string, unknown>) {
  const id = payload.id as string;
  await opencodeClient!.session.delete({ path: { id } });
  return {};
}

async function handleAiGetMessages(payload: Record<string, unknown>) {
  const id = payload.id as string;
  const response = await opencodeClient!.session.messages({ path: { id } });
  return { messages: response.data };
}
```

**Prompting (fire-and-forget, results come via events):**

```typescript
async function handleAiPrompt(payload: Record<string, unknown>) {
  const sessionId = payload.sessionId as string;
  const text = payload.text as string;
  const model = payload.model as { providerID: string; modelID: string } | undefined;

  // Fire and forget — results stream via SSE events forwarded on data channel
  opencodeClient!.session.prompt({
    path: { id: sessionId },
    body: {
      parts: [{ type: "text", text }],
      ...(model ? { model } : {}),
    },
  }).catch((err) => {
    // Send error as event on data channel
    if (dataChannel && dataChannel.readyState === WebSocket.OPEN) {
      dataChannel.send(JSON.stringify({
        v: 1,
        id: `evt-${Date.now()}`,
        ns: "ai",
        action: "event",
        payload: {
          type: "prompt_error",
          properties: { sessionId, error: err.message },
        },
      }));
    }
  });

  return { ack: true };
}
```

**Abort:**

```typescript
async function handleAiAbort(payload: Record<string, unknown>) {
  const id = payload.sessionId as string;
  await opencodeClient!.session.abort({ path: { id } });
  return {};
}
```

**Agents & Providers:**

```typescript
async function handleAiAgents() {
  const response = await opencodeClient!.app.agents();
  return { agents: response.data };
}

async function handleAiProviders() {
  const response = await opencodeClient!.config.providers();
  return { providers: response.data };
}
```

**Auth:**

```typescript
async function handleAiSetAuth(payload: Record<string, unknown>) {
  const providerId = payload.providerId as string;
  const key = payload.key as string;
  await opencodeClient!.auth.set({
    path: { id: providerId },
    body: { type: "api", key },
  });
  return {};
}
```

**Commands (undo/redo/share/etc.):**

```typescript
async function handleAiCommand(payload: Record<string, unknown>) {
  const sessionId = payload.sessionId as string;
  const command = payload.command as string;
  const response = await opencodeClient!.session.command({
    path: { id: sessionId },
    body: { command },
  });
  return { result: response.data };
}

async function handleAiRevert(payload: Record<string, unknown>) {
  const sessionId = payload.sessionId as string;
  const messageId = payload.messageId as string;
  await opencodeClient!.session.revert({
    path: { id: sessionId },
    body: { messageID: messageId },
  });
  return {};
}

async function handleAiUnrevert(payload: Record<string, unknown>) {
  const sessionId = payload.sessionId as string;
  await opencodeClient!.session.unrevert({ path: { id: sessionId } });
  return {};
}

async function handleAiShare(payload: Record<string, unknown>) {
  const sessionId = payload.sessionId as string;
  const response = await opencodeClient!.session.share({ path: { id: sessionId } });
  return { share: response.data };
}
```

### 1.5 Event Forwarding (SSE → WebSocket)

Subscribe to ALL OpenCode events and forward them on the data channel:

```typescript
async function subscribeToOpenCodeEvents(client: typeof opencodeClient) {
  try {
    const events = await client!.event.subscribe();

    for await (const event of events.stream) {
      // Forward every event to mobile app via data channel
      if (dataChannel && dataChannel.readyState === WebSocket.OPEN) {
        const msg: Message = {
          v: 1,
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          ns: "ai",
          action: "event",
          payload: {
            type: event.type,
            properties: event.properties,
          },
        };
        dataChannel.send(JSON.stringify(msg));
      }
    }
  } catch (err) {
    console.error("OpenCode event stream error:", err);
    // Reconnect after delay
    setTimeout(() => subscribeToOpenCodeEvents(client), 3000);
  }
}
```

### 1.6 Permission Handling

When OpenCode emits `EventPermissionUpdated`, it's asking for permission. The event is automatically forwarded to mobile via the event stream (1.5). When the mobile user responds, the CLI receives the `ai.permission` action:

```typescript
async function handleAiPermissionReply(payload: Record<string, unknown>) {
  const permissionId = payload.permissionId as string;
  const sessionId = payload.sessionId as string;
  const approved = payload.approved as boolean;

  // Call OpenCode SDK to respond to the permission request
  await opencodeClient!.session.postSessionByIdPermissionsByPermissionId({
    path: { id: sessionId, permissionId },
    body: { allow: approved },
  });

  return {};
}
```

### 1.7 Graceful Shutdown

Update the SIGINT handler to also shut down OpenCode:

```typescript
process.on("SIGINT", () => {
  console.log("\nShutting down...");
  // ... existing cleanup (terminals, processes) ...

  // OpenCode server will be cleaned up when the process exits
  // (createOpencode() manages the server lifecycle)

  controlWs.close();
  dataWs.close();
  process.exit(0);
});
```

---

## Step 2: Gateway — Fix Session Lifecycle

### 2.1 Remove Hard TTL

In `gateway/src/index.ts`:

**Remove** the 10-minute TTL constant:

```typescript
// REMOVE: const SESSION_TTL_MS = 10 * 60 * 1000;
```

**Add** a long safety TTL for truly orphaned sessions:

```typescript
const SAFETY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours — only catches zombie sessions
```

### 2.2 Change Session Lifecycle Logic

Sessions live while the CLI is connected:

1. **CLI disconnects** → terminate entire session (app can't do anything without CLI)
2. **App disconnects** → keep session alive, unlock so app can reconnect
3. **Safety TTL** → clean up sessions older than 24 hours with no connected sockets

**Update the `close` handler:**

```typescript
close(ws, closeCode, reason) {
  const { code: sessionCode, role, channel } = ws.data;
  const session = sessions.get(sessionCode);

  console.log(`[ws] ${role}/${channel} disconnected: ${sessionCode}`);

  if (session) {
    session.sockets[role][channel] = null;

    if (role === "cli") {
      // CLI disconnect = end everything
      terminateSession(session, "cli disconnected");
    } else {
      // App disconnect = notify CLI, keep session alive for reconnect
      const cliControl = session.sockets.cli.control;
      if (cliControl) {
        sendSystemMessage(cliControl, "peer_disconnected", { peer: "app" });
      }
      // Unlock session so app can reconnect
      if (!isPeerFullyConnected(session, "app")) {
        session.locked = false;
      }
    }
  }
}
```

**Update `cleanupExpiredSessions`:**

```typescript
function cleanupExpiredSessions(): void {
  const now = Date.now();
  for (const [_, session] of sessions) {
    const hasAnySockets =
      session.sockets.cli.control !== null ||
      session.sockets.cli.data !== null ||
      session.sockets.app.control !== null ||
      session.sockets.app.data !== null;

    // Only clean up truly orphaned AND old sessions
    if (!hasAnySockets && now - session.createdAt > SAFETY_TTL_MS) {
      terminateSession(session, "safety TTL expired (no sockets)");
    }
  }
}

setInterval(cleanupExpiredSessions, 5 * 60 * 1000); // Check every 5 minutes
```

---

## Step 3: Mobile App — AI Integration

### 3.1 Create `useAI` Hook

**New file: `app/hooks/useAI.ts`**

Follows the same pattern as the existing `useTerminal.ts` — uses `useConnection()` to access the connection context.

```typescript
import { useCallback } from 'react';
import { useConnection, type Response } from '@/contexts/ConnectionContext';
import type { Session, Agent, Provider, ModelRef, AIEvent } from '@/plugins/core/ai/types';

export function useAI() {
  const { sendControl, onDataEvent } = useConnection();

  // Session management
  const createSession = useCallback(async (title?: string): Promise<Session> => {
    const response = await sendControl('ai', 'createSession', { title });
    if (!response.ok) throw new Error(response.error?.message || 'Failed');
    return response.payload.session as Session;
  }, [sendControl]);

  const listSessions = useCallback(async (): Promise<Session[]> => {
    const response = await sendControl('ai', 'listSessions');
    if (!response.ok) throw new Error(response.error?.message || 'Failed');
    return response.payload.sessions as Session[];
  }, [sendControl]);

  const getSession = useCallback(async (id: string): Promise<Session> => {
    const response = await sendControl('ai', 'getSession', { id });
    if (!response.ok) throw new Error(response.error?.message || 'Failed');
    return response.payload.session as Session;
  }, [sendControl]);

  const deleteSession = useCallback(async (id: string): Promise<void> => {
    const response = await sendControl('ai', 'deleteSession', { id });
    if (!response.ok) throw new Error(response.error?.message || 'Failed');
  }, [sendControl]);

  const getMessages = useCallback(async (sessionId: string) => {
    const response = await sendControl('ai', 'getMessages', { id: sessionId });
    if (!response.ok) throw new Error(response.error?.message || 'Failed');
    return response.payload.messages;
  }, [sendControl]);

  // Prompting
  const sendPrompt = useCallback(async (sessionId: string, text: string, model?: ModelRef): Promise<void> => {
    const response = await sendControl('ai', 'prompt', { sessionId, text, model });
    if (!response.ok) throw new Error(response.error?.message || 'Failed');
    // Response is just { ack: true } — real results come via events
  }, [sendControl]);

  const abort = useCallback(async (sessionId: string): Promise<void> => {
    const response = await sendControl('ai', 'abort', { sessionId });
    if (!response.ok) throw new Error(response.error?.message || 'Failed');
  }, [sendControl]);

  // Configuration
  const getAgents = useCallback(async (): Promise<Agent[]> => {
    const response = await sendControl('ai', 'agents');
    if (!response.ok) throw new Error(response.error?.message || 'Failed');
    return response.payload.agents as Agent[];
  }, [sendControl]);

  const getProviders = useCallback(async (): Promise<Provider[]> => {
    const response = await sendControl('ai', 'providers');
    if (!response.ok) throw new Error(response.error?.message || 'Failed');
    return response.payload.providers as Provider[];
  }, [sendControl]);

  const setAuth = useCallback(async (providerId: string, key: string): Promise<void> => {
    const response = await sendControl('ai', 'setAuth', { providerId, key });
    if (!response.ok) throw new Error(response.error?.message || 'Failed');
  }, [sendControl]);

  // Commands
  const runCommand = useCallback(async (sessionId: string, command: string) => {
    const response = await sendControl('ai', 'command', { sessionId, command });
    if (!response.ok) throw new Error(response.error?.message || 'Failed');
    return response.payload.result;
  }, [sendControl]);

  const revert = useCallback(async (sessionId: string, messageId: string): Promise<void> => {
    const response = await sendControl('ai', 'revert', { sessionId, messageId });
    if (!response.ok) throw new Error(response.error?.message || 'Failed');
  }, [sendControl]);

  const unrevert = useCallback(async (sessionId: string): Promise<void> => {
    const response = await sendControl('ai', 'unrevert', { sessionId });
    if (!response.ok) throw new Error(response.error?.message || 'Failed');
  }, [sendControl]);

  const share = useCallback(async (sessionId: string) => {
    const response = await sendControl('ai', 'share', { sessionId });
    if (!response.ok) throw new Error(response.error?.message || 'Failed');
    return response.payload.share as { url: string };
  }, [sendControl]);

  // Permissions
  const replyPermission = useCallback(async (
    sessionId: string, permissionId: string, approved: boolean
  ): Promise<void> => {
    const response = await sendControl('ai', 'permission', { sessionId, permissionId, approved });
    if (!response.ok) throw new Error(response.error?.message || 'Failed');
  }, [sendControl]);

  // Event subscription — filters for ai namespace events only
  const onEvent = useCallback((handler: (event: AIEvent) => void) => {
    return onDataEvent((message) => {
      if (message.ns === 'ai' && message.action === 'event') {
        handler(message.payload as unknown as AIEvent);
      }
    });
  }, [onDataEvent]);

  return {
    createSession, listSessions, getSession, deleteSession, getMessages,
    sendPrompt, abort,
    getAgents, getProviders, setAuth,
    runCommand, revert, unrevert, share,
    replyPermission,
    onEvent,
  };
}
```

### 3.2 Define AI Types

**New file: `app/plugins/core/ai/types.ts`**

```typescript
// Mirrors OpenCode types needed on the mobile side

export interface AIEvent {
  type: string;
  properties: Record<string, unknown>;
}

export interface Session {
  id: string;
  projectID: string;
  title: string;
  version: string;
  time: { created: number; updated: number };
  share?: { url: string };
  summary?: {
    additions: number;
    deletions: number;
    files: number;
  };
}

export interface ModelRef {
  providerID: string;
  modelID: string;
}

export interface Model {
  id: string;
  providerID: string;
  name?: string;
}

export interface Agent {
  name: string;
  description?: string;
  mode: "subagent" | "primary" | "all";
  builtIn: boolean;
  model?: ModelRef;
}

export interface Provider {
  id: string;
  name: string;
  source: string;
  models: Record<string, Model>;
}

// Message types
export interface UserMessage {
  id: string;
  sessionID: string;
  role: "user";
  time: { created: number };
  agent: string;
  model: ModelRef;
}

export interface AssistantMessage {
  id: string;
  sessionID: string;
  role: "assistant";
  time: { created: number; completed?: number };
  parentID: string;
  modelID: string;
  providerID: string;
  cost: number;
  tokens: { input: number; output: number; reasoning: number };
  error?: { type: string; message: string };
}

export type Message = UserMessage | AssistantMessage;

// Part types (what gets rendered in the chat)
export type Part =
  | { type: "text"; text: string }
  | { type: "tool"; tool: string; input: unknown; output: unknown }
  | { type: "file"; file: string; content?: string }
  | { type: "patch"; file: string; additions: number; deletions: number; patch: string }
  | { type: "step-start"; step: string }
  | { type: "step-finish"; step: string }
  | { type: "reasoning"; text: string }
  | { type: "snapshot" }
  | { type: "subtask"; prompt: string; description: string; agent: string };

export interface Permission {
  id: string;
  sessionID: string;
  type: string;
  title: string;
  metadata: Record<string, unknown>;
}
```

### 3.3 Rewrite AI Panel (`app/plugins/core/ai/Panel.tsx`)

**Replace the current placeholder with a fully wired implementation.**

**Key state structure:**

```typescript
// Session state
const [sessions, setSessions] = useState<Session[]>([]);
const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
const [messagesBySession, setMessagesBySession] = useState<Map<string, MessageWithParts[]>>(new Map());

// Config state (fetched dynamically from OpenCode)
const [agents, setAgents] = useState<Agent[]>([]);
const [providers, setProviders] = useState<Provider[]>([]);
const [selectedAgent, setSelectedAgent] = useState<string>("build");
const [selectedModel, setSelectedModel] = useState<ModelRef | null>(null);

// UI state
const [inputText, setInputText] = useState("");
const [isStreaming, setIsStreaming] = useState(false);
const [pendingPermission, setPendingPermission] = useState<Permission | null>(null);
const [needsApiKey, setNeedsApiKey] = useState(false);
```

**On mount / connection established:**

1. Call `ai.agents` → populate agent dropdown (replaces hardcoded Build/Plan modes)
2. Call `ai.providers` → populate model dropdown (replaces hardcoded Claude/GPT/Gemini)
3. Call `ai.listSessions` → populate session list/tabs
4. If providers have no configured keys → show API key setup flow
5. Subscribe to AI events via `onEvent`

**Event handling:**

```typescript
useEffect(() => {
  const unsubscribe = onEvent((event) => {
    switch (event.type) {
      case "message.updated":
        // Update/add message in state
        break;
      case "message.part.updated":
        // Update/append part to message (streaming text, tool calls, etc.)
        break;
      case "session.status":
        // Session busy/idle → toggle isStreaming
        break;
      case "session.idle":
        setIsStreaming(false);
        break;
      case "permission.updated":
        // Show permission dialog
        setPendingPermission(event.properties as Permission);
        break;
      case "permission.replied":
        setPendingPermission(null);
        break;
      case "file.edited":
        // Can show indicator (files auto-sync via fs namespace)
        break;
      case "session.error":
        // Show error toast/message
        break;
      case "pty.created":
      case "pty.updated":
      case "pty.exited":
        // Show PTY output inline in chat stream
        break;
    }
  });
  return unsubscribe;
}, [onEvent]);
```

**Send prompt flow:**

```
1. User types in input, presses send
2. Check for slash commands:
   - /undo → ai.revert on last user message
   - /redo → ai.unrevert
   - /share → ai.share, show URL
   - /abort → ai.abort
   - /init → ai.command("init")
3. Otherwise → send as prompt:
   a. If no active session → create one first (ai.createSession)
   b. Call sendPrompt(activeSessionId, inputText, selectedModel)
   c. Set isStreaming = true
   d. Clear input
4. Results arrive via events and update the message list
```

**Message rendering (OpenCode TUI style):**

Each message is rendered as a stream of Parts:
- `TextPart` → Rendered as markdown text (streaming — text grows as parts update)
- `ToolPart` → Expandable card showing tool name, input, output
- `FilePart` → File path with syntax-highlighted content
- `PatchPart` → Diff view showing additions (green) / deletions (red)
- `StepStartPart` / `StepFinishPart` → Step indicator with spinner/checkmark
- `ReasoningPart` → Collapsible reasoning block
- `SubtaskPart` → Nested task indicator
- PTY output → Inline terminal output block with monospace styling

**Permission Dialog:**

When `pendingPermission` is set, show a modal overlay:

```
┌─────────────────────────────────────┐
│ OpenCode wants to:                  │
│ {permission.title}                  │
│                                     │
│ {permission.metadata details}       │
│                                     │
│    [Deny]          [Approve]        │
└─────────────────────────────────────┘
```

On press: call `replyPermission(sessionId, permissionId, approved)`, clear state.

**API Key Setup Flow:**

On first use (or if providers show no configured keys):
1. Show setup screen in the AI panel listing providers needing keys
2. User enters API key for their provider
3. Key stored in AsyncStorage (for persistence across app sessions)
4. Key sent to CLI via `ai.setAuth(providerId, key)`
5. OpenCode stores the key on the desktop machine
6. On future connections: check AsyncStorage, re-send keys via `ai.setAuth` if provider on desktop doesn't have them

**Session Management via Tabs:**

The existing tab system maps to OpenCode sessions:
- Each tab = one OpenCode session
- Tab title = session title
- "+" button → `ai.createSession`
- Close button → `ai.deleteSession`
- On reconnect: `ai.listSessions` restores tabs, `ai.getMessages` restores history

### 3.4 Action Buttons

Add action buttons to the options bar (alongside existing image button):

- **Abort** (square/stop icon) — visible when `isStreaming`, calls `ai.abort`
- **Undo** (undo arrow icon) — calls `ai.revert` on the last user message
- **Redo** (redo arrow icon) — calls `ai.unrevert`
- **Share** (share icon) — calls `ai.share`, shows share URL in toast

### 3.5 Reconnection & Session Restore

When ConnectionContext detects reconnection (peer_connected event):
1. Call `ai.listSessions` to get existing sessions
2. For each session, call `ai.getMessages` to restore conversation history
3. Re-subscribe to events (automatic via `onDataEvent` re-registration)
4. Check AsyncStorage for API keys, re-send via `ai.setAuth` if needed

---

## Step 4: Message Protocol — AI Namespace Reference

### 4.1 Actions (Mobile → CLI via control channel)

| Action | Payload | Response |
|--------|---------|----------|
| `ai.prompt` | `{ sessionId, text, model? }` | `{ ack: true }` |
| `ai.createSession` | `{ title? }` | `{ session: Session }` |
| `ai.listSessions` | `{}` | `{ sessions: Session[] }` |
| `ai.getSession` | `{ id }` | `{ session: Session }` |
| `ai.deleteSession` | `{ id }` | `{}` |
| `ai.getMessages` | `{ id }` | `{ messages: Message[] }` |
| `ai.abort` | `{ sessionId }` | `{}` |
| `ai.agents` | `{}` | `{ agents: Agent[] }` |
| `ai.providers` | `{}` | `{ providers: Provider[] }` |
| `ai.setAuth` | `{ providerId, key }` | `{}` |
| `ai.command` | `{ sessionId, command }` | `{ result }` |
| `ai.revert` | `{ sessionId, messageId }` | `{}` |
| `ai.unrevert` | `{ sessionId }` | `{}` |
| `ai.share` | `{ sessionId }` | `{ share: { url } }` |
| `ai.permission` | `{ sessionId, permissionId, approved }` | `{}` |

### 4.2 Events (CLI → Mobile via data channel)

All events use the same envelope format:

```typescript
{
  v: 1,
  id: "evt-...",
  ns: "ai",
  action: "event",
  payload: {
    type: "message.updated" | "message.part.updated" | "session.status" | ...,
    properties: { /* OpenCode event properties, passed through as-is */ }
  }
}
```

**Key event types the mobile app handles:**

| Event Type | Purpose |
|------------|---------|
| `message.updated` | New message created or status changed |
| `message.part.updated` | Part added/updated (streaming text, tool calls) |
| `message.removed` | Message deleted (from revert) |
| `message.part.removed` | Part removed |
| `session.status` | Session busy/idle state |
| `session.idle` | Session finished processing |
| `session.error` | Error occurred |
| `session.created` | New session created (from another client) |
| `session.updated` | Session metadata changed |
| `session.deleted` | Session removed |
| `permission.updated` | Permission request from OpenCode |
| `permission.replied` | Permission resolved |
| `file.edited` | File was modified by OpenCode |
| `pty.created` | Terminal/command started |
| `pty.updated` | Terminal output |
| `pty.exited` | Terminal/command finished |
| `prompt_error` | Error sending prompt (custom, not from OpenCode) |

---

## Build Order (Incremental)

### Phase 1: CLI + OpenCode SDK
1. Add `@opencode-ai/sdk` to `cli/package.json`
2. Add `createOpencode()` startup in `main()`
3. Add module-level `opencodeClient` variable
4. Add all 15 AI handler functions
5. Add `"ai"` case to the message router switch
6. Add `"ai"` to capabilities namespace list
7. Add event subscription and forwarding via `subscribeToOpenCodeEvents()`
8. Add permission reply handler
9. Update graceful shutdown
10. **Test:** Run CLI, verify "OpenCode ready" appears, verify event stream connects

### Phase 2: Gateway Fix
1. Remove `SESSION_TTL_MS` constant (10-min)
2. Add `SAFETY_TTL_MS` constant (24h)
3. Update `close` handler: CLI disconnect terminates, app disconnect preserves
4. Update `cleanupExpiredSessions` to use safety TTL + check for no sockets
5. **Test:** Connect CLI + app, disconnect app, verify session survives. Disconnect CLI, verify session terminates.

### Phase 3: Mobile App
1. Create `app/plugins/core/ai/types.ts` with all type definitions
2. Create `app/hooks/useAI.ts` with all methods
3. Rewrite `app/plugins/core/ai/Panel.tsx`:
   a. Wire session management (tabs = sessions)
   b. Wire prompt sending with slash command detection
   c. Wire event handling and streaming message display
   d. Implement message part rendering (text, tool, file, patch, step, etc.)
   e. Add dynamic agent/model dropdowns
   f. Add permission dialog
   g. Add action buttons (abort, undo, redo, share)
   h. Add API key setup flow
   i. Add reconnection/session restore
4. **Test:** Full end-to-end flow

---

## Verification

### End-to-End Test Checklist
1. Start CLI in a project directory: `cd my-project && npx lunel-cli`
2. Verify "OpenCode ready" appears in CLI output
3. Scan QR code with Lunel mobile app
4. In AI panel, verify agents and models load dynamically in dropdowns
5. Send a prompt: "Explain the structure of this codebase"
6. Verify streaming response appears (text parts updating in real-time)
7. Send a prompt that triggers a file edit (e.g., "Add a comment to package.json")
8. Verify permission dialog appears on mobile
9. Approve permission, verify file is edited and response completes
10. Type `/undo` in chat input, verify revert works
11. Test abort button while AI is generating
12. Disconnect mobile app, reconnect, verify sessions restore with history
13. Close CLI (Ctrl+C), verify mobile shows disconnected state
14. Verify API key setup flow works on fresh install

### Unit Checks
- CLI: OpenCode starts without error on `main()`
- CLI: All 15 AI actions respond correctly when called directly
- CLI: Event stream forwards events on data channel
- Gateway: Session survives app disconnect
- Gateway: Session terminates on CLI disconnect
- Gateway: Safety cleanup ignores sessions with active sockets
- Mobile: `useAI` hook methods call correct control messages
- Mobile: Event subscription receives and dispatches by type
- Mobile: Permission dialog approve/deny sends correct payload
- Mobile: Slash commands are parsed before sending as prompts
