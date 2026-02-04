# Lunel API Specification v2

> Complete API specification for Lunel App, Proxy, and CLI integration.
> This document supersedes api-rewrite.md with full plugin support.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Message Protocol](#message-protocol)
3. [Proxy API](#proxy-api)
4. [Namespace Reference](#namespace-reference)
   - [system](#system-namespace)
   - [fs](#fs-namespace)
   - [git](#git-namespace)
   - [terminal](#terminal-namespace) *(skip for now)*
   - [processes](#processes-namespace)
   - [ports](#ports-namespace)
   - [monitor](#monitor-namespace)
   - [http](#http-namespace)
5. [App Integration Guide](#app-integration-guide)
6. [Error Codes](#error-codes)
7. [Implementation Status](#implementation-status)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              LUNEL ARCHITECTURE                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
│     LUNEL APP       │         │    LUNEL PROXY      │         │     LUNEL CLI       │
│  (React Native)     │         │   (Bun Server)      │         │   (Node.js/npx)     │
├─────────────────────┤         ├─────────────────────┤         ├─────────────────────┤
│                     │         │                     │         │                     │
│  ┌───────────────┐  │   WSS   │  ┌───────────────┐  │   WSS   │  ┌───────────────┐  │
│  │ Control Chan  │◄─┼─────────┼─►│ Session Relay │◄─┼─────────┼─►│ Control Chan  │  │
│  └───────────────┘  │         │  └───────────────┘  │         │  └───────────────┘  │
│                     │         │                     │         │                     │
│  ┌───────────────┐  │   WSS   │  ┌───────────────┐  │   WSS   │  ┌───────────────┐  │
│  │ Data Channel  │◄─┼─────────┼─►│ Session Relay │◄─┼─────────┼─►│ Data Channel  │  │
│  └───────────────┘  │         │  └───────────────┘  │         │  └───────────────┘  │
│                     │         │                     │         │                     │
├─────────────────────┤         ├─────────────────────┤         ├─────────────────────┤
│ PLUGINS:            │         │ FEATURES:           │         │ HANDLERS:           │
│ • Editor            │         │ • 10-char codes     │         │ • system.*          │
│ • Explorer          │         │ • Session locking   │         │ • fs.*              │
│ • Git               │         │ • Auto-cleanup      │         │ • git.*             │
│ • Processes         │         │ • 64KB ctrl limit   │         │ • processes.*       │
│ • HTTP              │         │                     │         │ • ports.*           │
│ • Ports             │         │                     │         │ • monitor.*         │
│ • Monitor           │         │                     │         │ • http.*            │
│ • Tools (local)     │         │                     │         │                     │
└─────────────────────┘         └─────────────────────┘         └─────────────────────┘
```

### Channel Separation

| Channel     | Max Size | Purpose                                    | Examples                        |
|-------------|----------|--------------------------------------------|---------------------------------|
| **control** | 64 KB    | Commands, metadata, small responses        | ls, stat, git status, kill proc |
| **data**    | Unlimited| File contents, streams, large payloads     | read file, write file, diffs    |

### Connection Flow

```
1. CLI: POST /v1/session → receives {code: "ABcd123456"}
2. CLI: Display QR code with session code
3. CLI: Connect WSS /v1/ws/cli/control?code=ABcd123456
4. CLI: Connect WSS /v1/ws/cli/data?code=ABcd123456
5. App: Scan QR → extract code
6. App: Connect WSS /v1/ws/app/control?code=ABcd123456 → session LOCKED
7. App: Connect WSS /v1/ws/app/data?code=ABcd123456
8. Proxy: Sends {type: "peer_connected"} to both
9. App↔CLI: Exchange messages via proxy relay
10. Either disconnects → session terminated, both kicked
```

---

## Message Protocol

### Protocol Version

All messages use protocol version `v: 1`.

### Request Message

```typescript
interface Request {
  v: 1;                              // Protocol version (always 1)
  id: string;                        // Unique ID for request/response matching
  ns: string;                        // Namespace (system, fs, git, etc.)
  action: string;                    // Action within namespace
  payload: Record<string, unknown>;  // Action-specific parameters
}
```

### Response Message

```typescript
interface Response {
  v: 1;
  id: string;                        // Echoes request ID
  ns: string;                        // Echoes namespace
  action: string;                    // Echoes action
  ok: boolean;                       // true = success, false = error
  payload: Record<string, unknown>;  // Result data (if ok=true)
  error?: {                          // Error info (if ok=false)
    code: string;                    // Machine-readable error code
    message: string;                 // Human-readable message
  };
}
```

### Event Message (CLI → App, unsolicited)

```typescript
interface Event {
  v: 1;
  id: string;                        // Event ID (evt-{timestamp})
  ns: string;                        // Namespace
  action: string;                    // Event type
  payload: Record<string, unknown>;  // Event data
}
```

### System Messages (from Proxy)

```typescript
interface SystemMessage {
  type: "connected" | "peer_connected" | "peer_disconnected" | "error";
  role?: string;                     // "cli" or "app"
  channel?: string;                  // "control" or "data"
  peer?: string;                     // The other peer's role
}
```

### Message ID Generation

```typescript
// Request IDs (App)
const requestId = `msg-${Date.now()}-${counter++}`;

// Event IDs (CLI)
const eventId = `evt-${Date.now()}`;
```

---

## Proxy API

### REST Endpoints

| Method | Endpoint       | Description                    | Response                |
|--------|----------------|--------------------------------|-------------------------|
| GET    | `/health`      | Health check                   | `{ "status": "ok" }`    |
| POST   | `/v1/session`  | Create new session             | `{ "code": "ABcd123456" }` |
| OPTIONS| `/*`           | CORS preflight                 | 204 No Content          |

### WebSocket Endpoints

| Endpoint                        | Role | Channel | Purpose              |
|---------------------------------|------|---------|----------------------|
| `/v1/ws/cli/control?code=XXX`   | CLI  | control | CLI control messages |
| `/v1/ws/cli/data?code=XXX`      | CLI  | data    | CLI data messages    |
| `/v1/ws/app/control?code=XXX`   | App  | control | App control messages |
| `/v1/ws/app/data?code=XXX`      | App  | data    | App data messages    |

### Session Rules

- **Code format**: 10 alphanumeric characters (base54: excludes I, L, O, l, o, 0, 1)
- **Session TTL**: 10 minutes (cleanup runs every 60s)
- **Locking**: Session locks when first app connects (403 for subsequent apps)
- **Termination**: Any socket disconnect → entire session terminated
- **Slot protection**: Can't connect to already-occupied slot (409)

---

## Namespace Reference

---

### System Namespace

Core system operations and capability discovery.

#### `system.capabilities` (control)

Get CLI capabilities on connect. **App should call this immediately after connection.**

```typescript
// Request
{ v: 1, id: "1", ns: "system", action: "capabilities", payload: {} }

// Response
{
  v: 1, id: "1", ns: "system", action: "capabilities", ok: true,
  payload: {
    version: "1.0.0",
    namespaces: ["fs", "git", "terminal", "processes", "ports", "monitor", "http"],
    platform: "darwin" | "linux" | "win32",
    rootDir: "/Users/soham/myproject",
    hostname: "MacBook-Pro.local"
  }
}
```

#### `system.ping` (control)

Health check / keepalive.

```typescript
// Request
{ v: 1, id: "2", ns: "system", action: "ping", payload: {} }

// Response
{ v: 1, id: "2", ns: "system", action: "ping", ok: true, payload: { pong: true, timestamp: 1704528000000 } }
```

---

### FS Namespace

File system operations. All paths are relative to CLI's `rootDir`.

#### `fs.ls` (control)

List directory contents.

```typescript
// Request
{ v: 1, id: "3", ns: "fs", action: "ls", payload: { path: "src" } }

// Response
{
  v: 1, id: "3", ns: "fs", action: "ls", ok: true,
  payload: {
    path: "src",
    entries: [
      { name: "index.ts", type: "file", size: 1234, mtime: 1703520000000 },
      { name: "components", type: "directory", mtime: 1703520000000 }
    ]
  }
}
```

**Payload:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| path  | string | No | "." | Directory path to list |

**Response:**
| Field | Type | Description |
|-------|------|-------------|
| path | string | Requested path |
| entries | FileEntry[] | Array of entries |

**FileEntry:**
```typescript
interface FileEntry {
  name: string;           // File/folder name
  type: "file" | "directory";
  size?: number;          // Bytes (files only)
  mtime?: number;         // Modification time (ms since epoch)
}
```

#### `fs.stat` (control)

Get file/directory metadata.

```typescript
// Request
{ v: 1, id: "4", ns: "fs", action: "stat", payload: { path: "src/index.ts" } }

// Response
{
  v: 1, id: "4", ns: "fs", action: "stat", ok: true,
  payload: {
    path: "src/index.ts",
    type: "file",
    size: 1234,
    mtime: 1703520000000,
    mode: 33188  // 0o100644
  }
}
```

#### `fs.read` (data)

Read file contents. Binary files are base64-encoded.

```typescript
// Request
{ v: 1, id: "5", ns: "fs", action: "read", payload: { path: "src/index.ts" } }

// Response (text file)
{
  v: 1, id: "5", ns: "fs", action: "read", ok: true,
  payload: {
    path: "src/index.ts",
    content: "import express from 'express';\n...",
    encoding: "utf8",
    size: 1234
  }
}

// Response (binary file)
{
  v: 1, id: "5", ns: "fs", action: "read", ok: true,
  payload: {
    path: "image.png",
    content: "iVBORw0KGgoAAAANSUhEUgAA...",
    encoding: "base64",
    size: 54321
  }
}
```

#### `fs.write` (data)

Write file contents. Creates parent directories if needed.

```typescript
// Request
{
  v: 1, id: "6", ns: "fs", action: "write",
  payload: {
    path: "src/index.ts",
    content: "// updated content\nimport express...",
    encoding: "utf8"  // or "base64" for binary
  }
}

// Response
{ v: 1, id: "6", ns: "fs", action: "write", ok: true, payload: { path: "src/index.ts" } }
```

**Payload:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| path | string | Yes | - | File path |
| content | string | Yes | - | File content |
| encoding | "utf8" \| "base64" | No | "utf8" | Content encoding |

#### `fs.mkdir` (control)

Create directory.

```typescript
// Request
{ v: 1, id: "7", ns: "fs", action: "mkdir", payload: { path: "src/components", recursive: true } }

// Response
{ v: 1, id: "7", ns: "fs", action: "mkdir", ok: true, payload: { path: "src/components" } }
```

#### `fs.rm` (control)

Remove file or directory.

```typescript
// Request
{ v: 1, id: "8", ns: "fs", action: "rm", payload: { path: "src/old.ts", recursive: false } }

// Response
{ v: 1, id: "8", ns: "fs", action: "rm", ok: true, payload: { path: "src/old.ts" } }
```

**Payload:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| path | string | Yes | - | Path to remove |
| recursive | boolean | No | false | Remove directories recursively |

#### `fs.mv` (control)

Move/rename file or directory.

```typescript
// Request
{ v: 1, id: "9", ns: "fs", action: "mv", payload: { from: "src/old.ts", to: "src/new.ts" } }

// Response
{ v: 1, id: "9", ns: "fs", action: "mv", ok: true, payload: { from: "src/old.ts", to: "src/new.ts" } }
```

#### `fs.grep` (control)

Search for pattern in files. Respects .gitignore.

```typescript
// Request
{
  v: 1, id: "10", ns: "fs", action: "grep",
  payload: {
    path: "src",
    pattern: "TODO|FIXME",
    caseSensitive: false,
    maxResults: 50
  }
}

// Response
{
  v: 1, id: "10", ns: "fs", action: "grep", ok: true,
  payload: {
    matches: [
      { file: "src/index.ts", line: 42, content: "// TODO: fix this" },
      { file: "src/utils.ts", line: 10, content: "// FIXME: refactor" }
    ]
  }
}
```

**Payload:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| path | string | No | "." | Directory to search |
| pattern | string | Yes | - | Regex pattern |
| caseSensitive | boolean | No | true | Case sensitive search |
| maxResults | number | No | 100 | Max results to return |

**GrepMatch:**
```typescript
interface GrepMatch {
  file: string;    // Relative file path
  line: number;    // Line number (1-indexed)
  content: string; // Line content (max 500 chars)
}
```

#### `fs.create` (control)

Create an empty file or directory. Convenience wrapper.

```typescript
// Request (file)
{ v: 1, id: "11", ns: "fs", action: "create", payload: { path: "src/new.ts", type: "file" } }

// Request (directory)
{ v: 1, id: "12", ns: "fs", action: "create", payload: { path: "src/components", type: "directory" } }

// Response
{ v: 1, id: "11", ns: "fs", action: "create", ok: true, payload: { path: "src/new.ts" } }
```

---

### Git Namespace

Git version control operations.

#### `git.status` (control)

Get working tree status.

```typescript
// Request
{ v: 1, id: "20", ns: "git", action: "status", payload: {} }

// Response
{
  v: 1, id: "20", ns: "git", action: "status", ok: true,
  payload: {
    branch: "main",
    ahead: 2,
    behind: 0,
    staged: [
      { path: "src/index.ts", status: "M" }
    ],
    unstaged: [
      { path: "src/utils.ts", status: "M" }
    ],
    untracked: ["src/new-file.ts"]
  }
}
```

**Status codes:** M (modified), A (added), D (deleted), R (renamed), C (copied), U (updated but unmerged)

#### `git.stage` (control)

Stage files for commit.

```typescript
// Request
{ v: 1, id: "21", ns: "git", action: "stage", payload: { paths: ["src/utils.ts", "src/new-file.ts"] } }

// Response
{ v: 1, id: "21", ns: "git", action: "stage", ok: true, payload: {} }
```

#### `git.unstage` (control)

Unstage files.

```typescript
// Request
{ v: 1, id: "22", ns: "git", action: "unstage", payload: { paths: ["src/index.ts"] } }

// Response
{ v: 1, id: "22", ns: "git", action: "unstage", ok: true, payload: {} }
```

#### `git.commit` (control)

Create a commit.

```typescript
// Request
{ v: 1, id: "23", ns: "git", action: "commit", payload: { message: "feat: add new feature" } }

// Response
{
  v: 1, id: "23", ns: "git", action: "commit", ok: true,
  payload: { hash: "abc1234", message: "feat: add new feature" }
}
```

#### `git.log` (control)

Get commit history.

```typescript
// Request
{ v: 1, id: "24", ns: "git", action: "log", payload: { limit: 20 } }

// Response
{
  v: 1, id: "24", ns: "git", action: "log", ok: true,
  payload: {
    commits: [
      { hash: "abc1234", message: "feat: add feature", author: "John Doe", date: 1703520000000 },
      { hash: "def5678", message: "fix: bug fix", author: "Jane Doe", date: 1703510000000 }
    ]
  }
}
```

#### `git.diff` (data)

Get diff for file or staging area.

```typescript
// Request (unstaged changes)
{ v: 1, id: "25", ns: "git", action: "diff", payload: { path: "src/index.ts", staged: false } }

// Request (staged changes)
{ v: 1, id: "26", ns: "git", action: "diff", payload: { staged: true } }

// Response
{
  v: 1, id: "25", ns: "git", action: "diff", ok: true,
  payload: { diff: "@@ -1,3 +1,4 @@\n+// new line\n import..." }
}
```

#### `git.branches` (control)

List branches.

```typescript
// Request
{ v: 1, id: "27", ns: "git", action: "branches", payload: {} }

// Response
{
  v: 1, id: "27", ns: "git", action: "branches", ok: true,
  payload: {
    current: "main",
    branches: ["main", "feature/new-ui", "fix/bug-123"]
  }
}
```

#### `git.checkout` (control)

Switch branch or create new branch.

```typescript
// Request (switch)
{ v: 1, id: "28", ns: "git", action: "checkout", payload: { branch: "feature/new-ui" } }

// Request (create and switch)
{ v: 1, id: "29", ns: "git", action: "checkout", payload: { branch: "feature/new", create: true } }

// Response
{ v: 1, id: "28", ns: "git", action: "checkout", ok: true, payload: { branch: "feature/new-ui" } }
```

#### `git.pull` (control)

Pull from remote.

```typescript
// Request
{ v: 1, id: "30", ns: "git", action: "pull", payload: {} }

// Response
{
  v: 1, id: "30", ns: "git", action: "pull", ok: true,
  payload: {
    success: true,
    summary: "Already up to date." | "Fast-forward\n 2 files changed..."
  }
}
```

#### `git.push` (control)

Push to remote.

```typescript
// Request
{ v: 1, id: "31", ns: "git", action: "push", payload: {} }

// Request (set upstream)
{ v: 1, id: "32", ns: "git", action: "push", payload: { setUpstream: true } }

// Response
{
  v: 1, id: "31", ns: "git", action: "push", ok: true,
  payload: { success: true }
}
```

#### `git.discard` (control)

Discard changes in working directory.

```typescript
// Request (specific files)
{ v: 1, id: "33", ns: "git", action: "discard", payload: { paths: ["src/index.ts"] } }

// Request (all changes)
{ v: 1, id: "34", ns: "git", action: "discard", payload: { all: true } }

// Response
{ v: 1, id: "33", ns: "git", action: "discard", ok: true, payload: {} }
```

---

### Terminal Namespace

> **Note:** Terminal support is skipped for initial release per requirements.
> Documented here for future reference.

#### `terminal.spawn` (control)
#### `terminal.write` (data)
#### `terminal.resize` (control)
#### `terminal.kill` (control)
#### `terminal.output` (data) - Event

---

### Processes Namespace

Process management and monitoring.

#### `processes.list` (control)

List running processes spawned by CLI.

```typescript
// Request
{ v: 1, id: "40", ns: "processes", action: "list", payload: {} }

// Response
{
  v: 1, id: "40", ns: "processes", action: "list", ok: true,
  payload: {
    processes: [
      {
        pid: 12345,
        command: "npm run dev",
        startTime: 1703520000000,
        status: "running"
      },
      {
        pid: 12346,
        command: "node server.js",
        startTime: 1703520001000,
        status: "running"
      }
    ]
  }
}
```

**Process:**
```typescript
interface Process {
  pid: number;           // Process ID
  command: string;       // Command that was run
  startTime: number;     // Start time (ms since epoch)
  status: "running" | "stopped";
}
```

#### `processes.spawn` (control)

Spawn a background process.

```typescript
// Request
{
  v: 1, id: "41", ns: "processes", action: "spawn",
  payload: {
    command: "npm",
    args: ["run", "dev"],
    cwd: ".",              // Optional, relative to rootDir
    env: { "PORT": "3000" } // Optional extra env vars
  }
}

// Response
{
  v: 1, id: "41", ns: "processes", action: "spawn", ok: true,
  payload: { pid: 12345, channel: "proc-12345" }
}
```

#### `processes.kill` (control)

Kill a process by PID.

```typescript
// Request
{ v: 1, id: "42", ns: "processes", action: "kill", payload: { pid: 12345 } }

// Response
{ v: 1, id: "42", ns: "processes", action: "kill", ok: true, payload: {} }
```

#### `processes.output` (data) - Event

Process stdout/stderr output (streamed to app).

```typescript
// Event (CLI → App)
{
  v: 1, id: "evt-1703520001000", ns: "processes", action: "output",
  payload: {
    pid: 12345,
    channel: "proc-12345",
    stream: "stdout" | "stderr",
    data: "Server running on port 3000\n"
  }
}
```

#### `processes.exit` (data) - Event

Process exit notification.

```typescript
// Event (CLI → App)
{
  v: 1, id: "evt-1703520002000", ns: "processes", action: "exit",
  payload: {
    pid: 12345,
    channel: "proc-12345",
    code: 0,
    signal: null
  }
}
```

#### `processes.getOutput` (control)

Get buffered output for a process channel.

```typescript
// Request
{ v: 1, id: "43", ns: "processes", action: "getOutput", payload: { channel: "proc-12345" } }

// Response
{
  v: 1, id: "43", ns: "processes", action: "getOutput", ok: true,
  payload: {
    channel: "proc-12345",
    output: "Server running on port 3000\nRequest received...\n"
  }
}
```

#### `processes.clearOutput` (control)

Clear output buffer for a channel.

```typescript
// Request
{ v: 1, id: "44", ns: "processes", action: "clearOutput", payload: { channel: "proc-12345" } }

// Response
{ v: 1, id: "44", ns: "processes", action: "clearOutput", ok: true, payload: {} }
```

---

### Ports Namespace

Network port monitoring and management.

#### `ports.list` (control)

List listening ports on the machine.

```typescript
// Request
{ v: 1, id: "50", ns: "ports", action: "list", payload: {} }

// Response
{
  v: 1, id: "50", ns: "ports", action: "list", ok: true,
  payload: {
    ports: [
      { port: 3000, pid: 12345, process: "node", address: "127.0.0.1" },
      { port: 5432, pid: 789, process: "postgres", address: "0.0.0.0" },
      { port: 8080, pid: 12346, process: "java", address: "0.0.0.0" }
    ]
  }
}
```

**PortInfo:**
```typescript
interface PortInfo {
  port: number;       // Port number
  pid: number;        // Process ID
  process: string;    // Process name
  address: string;    // Bound address
}
```

#### `ports.isAvailable` (control)

Check if a port is available.

```typescript
// Request
{ v: 1, id: "51", ns: "ports", action: "isAvailable", payload: { port: 3000 } }

// Response
{
  v: 1, id: "51", ns: "ports", action: "isAvailable", ok: true,
  payload: { port: 3000, available: false, pid: 12345 }
}
```

#### `ports.kill` (control)

Kill the process using a specific port.

```typescript
// Request
{ v: 1, id: "52", ns: "ports", action: "kill", payload: { port: 3000 } }

// Response
{ v: 1, id: "52", ns: "ports", action: "kill", ok: true, payload: { port: 3000, pid: 12345 } }
```

---

### Monitor Namespace

System resource monitoring.

#### `monitor.system` (control)

Get comprehensive system info (CPU, memory, disk, battery in one call).

```typescript
// Request
{ v: 1, id: "60", ns: "monitor", action: "system", payload: {} }

// Response
{
  v: 1, id: "60", ns: "monitor", action: "system", ok: true,
  payload: {
    cpu: {
      usage: 45.2,                    // Overall CPU usage %
      cores: [42.1, 48.3, 44.0, 46.5] // Per-core usage %
    },
    memory: {
      total: 17179869184,             // Total RAM in bytes (16 GB)
      used: 12884901888,              // Used RAM in bytes
      free: 4294967296,               // Free RAM in bytes
      usedPercent: 75.0
    },
    disk: [
      {
        mount: "/",
        filesystem: "disk1s1",
        size: 499963174912,           // Total size in bytes
        used: 249981587456,           // Used in bytes
        free: 249981587456,
        usedPercent: 50.0
      }
    ],
    battery: {
      hasBattery: true,
      percent: 85,
      charging: false,
      timeRemaining: 180              // Minutes, or null if unknown
    }
  }
}
```

#### `monitor.cpu` (control)

Get CPU usage only.

```typescript
// Request
{ v: 1, id: "61", ns: "monitor", action: "cpu", payload: {} }

// Response
{
  v: 1, id: "61", ns: "monitor", action: "cpu", ok: true,
  payload: {
    usage: 45.2,
    cores: [42.1, 48.3, 44.0, 46.5],
    model: "Apple M1 Pro",
    speed: 3200  // MHz
  }
}
```

#### `monitor.memory` (control)

Get memory usage only.

```typescript
// Request
{ v: 1, id: "62", ns: "monitor", action: "memory", payload: {} }

// Response
{
  v: 1, id: "62", ns: "monitor", action: "memory", ok: true,
  payload: {
    total: 17179869184,
    used: 12884901888,
    free: 4294967296,
    usedPercent: 75.0
  }
}
```

#### `monitor.disk` (control)

Get disk usage only.

```typescript
// Request
{ v: 1, id: "63", ns: "monitor", action: "disk", payload: {} }

// Response
{
  v: 1, id: "63", ns: "monitor", action: "disk", ok: true,
  payload: {
    disks: [
      { mount: "/", filesystem: "disk1s1", size: 499963174912, used: 249981587456, free: 249981587456, usedPercent: 50.0 }
    ]
  }
}
```

#### `monitor.battery` (control)

Get battery status only.

```typescript
// Request
{ v: 1, id: "64", ns: "monitor", action: "battery", payload: {} }

// Response
{
  v: 1, id: "64", ns: "monitor", action: "battery", ok: true,
  payload: {
    hasBattery: true,
    percent: 85,
    charging: false,
    timeRemaining: 180
  }
}
```

---

### HTTP Namespace

Execute HTTP requests from the CLI machine (useful for testing local APIs).

#### `http.request` (data)

Make an HTTP request.

```typescript
// Request
{
  v: 1, id: "70", ns: "http", action: "request",
  payload: {
    method: "POST",
    url: "http://localhost:3000/api/users",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer token123"
    },
    body: "{\"name\": \"John\"}",
    timeout: 30000  // Optional, ms
  }
}

// Response
{
  v: 1, id: "70", ns: "http", action: "request", ok: true,
  payload: {
    status: 201,
    statusText: "Created",
    headers: {
      "content-type": "application/json",
      "x-request-id": "abc123"
    },
    body: "{\"id\": 1, \"name\": \"John\"}",
    timing: 45  // Response time in ms
  }
}
```

**Payload:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| method | string | Yes | - | HTTP method (GET, POST, etc.) |
| url | string | Yes | - | Full URL |
| headers | object | No | {} | Request headers |
| body | string | No | - | Request body |
| timeout | number | No | 30000 | Timeout in ms |

**Response:**
| Field | Type | Description |
|-------|------|-------------|
| status | number | HTTP status code |
| statusText | string | HTTP status text |
| headers | object | Response headers |
| body | string | Response body |
| timing | number | Response time in ms |

---

## App Integration Guide

### Plugin to Namespace Mapping

| App Plugin   | CLI Namespace | Actions Used |
|--------------|---------------|--------------|
| **Editor**   | `fs`          | `read`, `write`, `stat` |
| **Explorer** | `fs`          | `ls`, `stat`, `create`, `mkdir`, `rm`, `mv`, `grep` |
| **Git**      | `git`         | `status`, `stage`, `unstage`, `commit`, `log`, `diff`, `branches`, `checkout`, `pull`, `push`, `discard` |
| **Processes**| `processes`   | `list`, `spawn`, `kill`, `getOutput`, `clearOutput` |
| **Ports**    | `ports`       | `list`, `isAvailable`, `kill` |
| **Monitor**  | `monitor`     | `system`, `cpu`, `memory`, `disk`, `battery` |
| **HTTP**     | `http`        | `request` |
| **Tools**    | *local*       | Runs entirely on device (no CLI needed) |
| **AI**       | *external*    | Calls external AI API directly from app |
| **Browser**  | *skip*        | Not implemented |
| **Terminal** | *skip*        | Not implemented |

### App GPI to API Mapping

#### EditorAPI

```typescript
// gPI.editor.openFile(path) → triggers:
{ ns: "fs", action: "read", payload: { path } }

// gPI.editor.getOpenFiles() → app-local state (no CLI call)

// gPI.editor.insertText(text) → app-local state (no CLI call)

// gPI.editor.getCurrentFile() → app-local state (no CLI call)

// Save file → triggers:
{ ns: "fs", action: "write", payload: { path, content, encoding } }
```

#### ExplorerAPI

```typescript
// gPI.explorer.list(path)
{ ns: "fs", action: "ls", payload: { path } }

// gPI.explorer.create(path, "file")
{ ns: "fs", action: "create", payload: { path, type: "file" } }

// gPI.explorer.create(path, "folder")
{ ns: "fs", action: "create", payload: { path, type: "directory" } }

// gPI.explorer.rename(from, to)
{ ns: "fs", action: "mv", payload: { from, to } }

// gPI.explorer.delete(path)
{ ns: "fs", action: "rm", payload: { path, recursive: true } }

// gPI.explorer.search(query, opts)
{ ns: "fs", action: "grep", payload: { pattern: query, ...opts } }
```

#### GitAPI

```typescript
// gPI.git.status()
{ ns: "git", action: "status", payload: {} }

// gPI.git.stage(files)
{ ns: "git", action: "stage", payload: { paths: files } }

// gPI.git.unstage(files)
{ ns: "git", action: "unstage", payload: { paths: files } }

// gPI.git.commit(message)
{ ns: "git", action: "commit", payload: { message } }

// gPI.git.diff(file?)
{ ns: "git", action: "diff", payload: { path: file, staged: false } }

// gPI.git.checkout(branch)
{ ns: "git", action: "checkout", payload: { branch } }

// gPI.git.pull()
{ ns: "git", action: "pull", payload: {} }

// gPI.git.push()
{ ns: "git", action: "push", payload: {} }
```

#### ProcessesAPI

```typescript
// gPI.processes.list()
{ ns: "processes", action: "list", payload: {} }

// gPI.processes.kill(pid)
{ ns: "processes", action: "kill", payload: { pid } }

// gPI.processes.getOutput(channel)
{ ns: "processes", action: "getOutput", payload: { channel } }

// gPI.processes.clearOutput(channel?)
{ ns: "processes", action: "clearOutput", payload: { channel } }
```

#### PortsAPI

```typescript
// gPI.ports.list()
{ ns: "ports", action: "list", payload: {} }

// gPI.ports.kill(port)
{ ns: "ports", action: "kill", payload: { port } }

// gPI.ports.isAvailable(port)
{ ns: "ports", action: "isAvailable", payload: { port } }
```

#### MonitorAPI

```typescript
// gPI.monitor.getCpuUsage()
{ ns: "monitor", action: "cpu", payload: {} }

// gPI.monitor.getMemory()
{ ns: "monitor", action: "memory", payload: {} }

// gPI.monitor.getDisk()
{ ns: "monitor", action: "disk", payload: {} }

// gPI.monitor.getBattery()
{ ns: "monitor", action: "battery", payload: {} }
```

#### HttpAPI

```typescript
// gPI.http.request(config)
{ ns: "http", action: "request", payload: config }
```

---

## Error Codes

| Code | Description | When Returned |
|------|-------------|---------------|
| `ENOENT` | File or directory not found | fs.read, fs.stat on missing path |
| `EACCES` | Permission denied / Path outside root | Sandboxed path violation |
| `EEXIST` | File already exists | fs.mkdir without recursive on existing |
| `EISDIR` | Expected file, got directory | fs.read on directory |
| `ENOTDIR` | Expected directory, got file | fs.ls on file |
| `ENOTEMPTY` | Directory not empty | fs.rm without recursive |
| `EINVAL` | Invalid argument | Missing required parameter |
| `EPERM` | Operation not permitted | OS-level permission issue |
| `ENOTGIT` | Not a git repository | git.* in non-git directory |
| `EGIT` | Git operation failed | git command returned error |
| `ENOTERM` | Terminal not found | Invalid terminalId |
| `ENOPROC` | Process not found | Invalid pid or channel |
| `EPROTO` | Protocol error | Unsupported protocol version |
| `ETIMEOUT` | Operation timed out | http.request timeout |
| `ENETWORK` | Network error | http.request connection failed |

---

## Implementation Status

### Proxy (lunel-proxy)

| Feature | Status | Notes |
|---------|--------|-------|
| Dual WebSocket channels | ✅ Done | control + data |
| Session creation | ✅ Done | POST /v1/session |
| Session locking | ✅ Done | Lock on app connect |
| Message relay | ✅ Done | Transparent relay |
| 64KB control limit | ✅ Done | Rejects large messages |
| Session TTL cleanup | ✅ Done | 10 minute TTL |

### CLI (lunel-cli)

| Namespace | Status | Notes |
|-----------|--------|-------|
| system.capabilities | ✅ Done | |
| system.ping | ✅ Done | |
| fs.ls | ✅ Done | |
| fs.stat | ✅ Done | |
| fs.read | ✅ Done | Auto base64 for binary |
| fs.write | ✅ Done | Creates parent dirs |
| fs.mkdir | ✅ Done | |
| fs.rm | ✅ Done | |
| fs.mv | ✅ Done | |
| fs.grep | ✅ Done | Respects .gitignore |
| fs.create | ✅ Done | File or directory |
| git.status | ✅ Done | |
| git.stage | ✅ Done | |
| git.unstage | ✅ Done | |
| git.commit | ✅ Done | |
| git.log | ✅ Done | |
| git.diff | ✅ Done | |
| git.branches | ✅ Done | |
| git.checkout | ✅ Done | Supports create flag |
| git.pull | ✅ Done | |
| git.push | ✅ Done | Supports setUpstream |
| git.discard | ✅ Done | Single files or all |
| processes.list | ✅ Done | Lists managed processes |
| processes.spawn | ✅ Done | With output streaming |
| processes.kill | ✅ Done | |
| processes.getOutput | ✅ Done | Buffered output |
| processes.clearOutput | ✅ Done | |
| ports.list | ✅ Done | Cross-platform |
| ports.isAvailable | ✅ Done | |
| ports.kill | ✅ Done | |
| monitor.system | ✅ Done | All-in-one |
| monitor.cpu | ✅ Done | With delta tracking |
| monitor.memory | ✅ Done | |
| monitor.disk | ✅ Done | Cross-platform |
| monitor.battery | ✅ Done | Cross-platform |
| http.request | ✅ Done | With timeout support |

### App (lunel)

| Integration | Status | Notes |
|-------------|--------|-------|
| ConnectionContext | ✅ Done | Dual WS channels |
| Plugin registry | ✅ Done | |
| GPI system | ✅ Done | |
| useApi hook | ✅ Done | Typed API wrapper |
| Editor → fs | ❌ TODO | Wire read/write |
| Explorer → fs | ✅ Done | ls, create, rm, mv, grep |
| Git → git | ✅ Done | status, stage, unstage, commit, log, diff, branches, checkout, pull, push, discard |
| Processes → processes | ✅ Done | list, spawn, kill, getOutput, clearOutput |
| Ports → ports | ✅ Done | list, kill |
| Monitor → monitor | ✅ Done | system (cpu, memory, disk, battery) |
| HTTP → http | ✅ Done | request with CLI proxy toggle |
| Tools (local) | ⏭️ Skip | Already works locally |
| Browser | ⏭️ Skip | Per requirements |
| Terminal | ⏭️ Skip | Per requirements |

---

## Appendix: Platform-Specific Notes

### Port Listing Commands

| Platform | Command |
|----------|---------|
| macOS | `lsof -iTCP -sTCP:LISTEN -P -n` |
| Linux | `ss -tlnp` or `netstat -tlnp` |
| Windows | `netstat -ano \| findstr LISTENING` |

### Battery Commands

| Platform | Command |
|----------|---------|
| macOS | `pmset -g batt` |
| Linux | `/sys/class/power_supply/BAT*/` |
| Windows | `WMIC Path Win32_Battery` |

### CPU Usage

All platforms can use Node.js `os.cpus()` with delta calculation over 100ms interval.

### Memory Usage

All platforms can use Node.js `os.totalmem()` and `os.freemem()`.

### Disk Usage

| Platform | Command |
|----------|---------|
| macOS/Linux | `df -k` |
| Windows | `wmic logicaldisk get size,freespace,caption` |

---

*Last updated: 2026-01-06*
