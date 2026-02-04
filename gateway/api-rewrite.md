# Lunel API Rewrite Plan

## Overview

Redesign the proxy API to support:
- Dual WebSocket channels (control + data)
- Namespaced, extensible protocol
- Future components (docker, k8s, etc.)

---

## Architecture

```
┌─────────────┐                    ┌─────────────┐                    ┌─────────────┐
│   App       │                    │   Proxy     │                    │   CLI       │
│   (Phone)   │                    │   (Cloud)   │                    │   (Desktop) │
├─────────────┤                    ├─────────────┤                    ├─────────────┤
│ control ────┼───── ws ──────────►│◄─── ws ─────┼──── control       │
│ channel     │                    │   relay     │        channel     │
├─────────────┤                    ├─────────────┤                    ├─────────────┤
│ data    ────┼───── ws ──────────►│◄─── ws ─────┼──── data          │
│ channel     │                    │   relay     │        channel     │
└─────────────┘                    └─────────────┘                    └─────────────┘
```

### Channels

| Channel | Purpose | Examples |
|---------|---------|----------|
| **control** | Small, fast messages (<64KB) | `ls`, `stat`, `git status`, events |
| **data** | Large payloads, streams | File contents, binary assets |

---

## Message Protocol

### Base Message Format

```typescript
interface Message {
  v: 1;                           // Protocol version
  id: string;                     // UUID for req/res matching
  ns: string;                     // Namespace
  action: string;                 // Action within namespace
  payload: Record<string, any>;   // Action-specific data
}

interface Response extends Message {
  ok: boolean;                    // Success or failure
  error?: {
    code: string;                 // Error code (ENOENT, EACCES, etc.)
    message: string;              // Human-readable message
  };
}
```

### Namespaces

| Namespace | Description |
|-----------|-------------|
| `system` | Connection management, capabilities, ping |
| `fs` | File system operations |
| `git` | Git operations |
| `terminal` | Terminal/shell operations |
| `docker` | Docker operations (future) |
| `http` | HTTP tunnel (future) |

---

## API Reference

### System Namespace (`system`)

#### `system.capabilities` (control)
Get CLI capabilities on connect.

```typescript
// Request
{ v: 1, id: "1", ns: "system", action: "capabilities", payload: {} }

// Response
{
  v: 1, id: "1", ns: "system", action: "capabilities", ok: true,
  payload: {
    version: "1.0.0",
    namespaces: ["fs", "git", "terminal"],
    platform: "darwin",
    rootDir: "/Users/soham/myproject"
  }
}
```

#### `system.ping` (control)
Health check.

```typescript
// Request
{ v: 1, id: "2", ns: "system", action: "ping", payload: {} }

// Response
{ v: 1, id: "2", ns: "system", action: "ping", ok: true, payload: { pong: true } }
```

---

### File System Namespace (`fs`)

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
      { name: "components", type: "directory" }
    ]
  }
}
```

#### `fs.stat` (control)
Get file/directory info.

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
    mode: 0o644
  }
}
```

#### `fs.read` (data)
Read file contents.

```typescript
// Request
{ v: 1, id: "5", ns: "fs", action: "read", payload: { path: "src/index.ts" } }

// Response
{
  v: 1, id: "5", ns: "fs", action: "read", ok: true,
  payload: {
    path: "src/index.ts",
    content: "import express from 'express';\n...",
    encoding: "utf8"  // or "base64" for binary
  }
}
```

#### `fs.write` (data)
Write file contents.

```typescript
// Request
{
  v: 1, id: "6", ns: "fs", action: "write",
  payload: {
    path: "src/index.ts",
    content: "// updated content",
    encoding: "utf8"
  }
}

// Response
{ v: 1, id: "6", ns: "fs", action: "write", ok: true, payload: { path: "src/index.ts" } }
```

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

#### `fs.mv` (control)
Move/rename file or directory.

```typescript
// Request
{ v: 1, id: "9", ns: "fs", action: "mv", payload: { from: "src/old.ts", to: "src/new.ts" } }

// Response
{ v: 1, id: "9", ns: "fs", action: "mv", ok: true, payload: { from: "src/old.ts", to: "src/new.ts" } }
```

#### `fs.grep` (control)
Search for pattern in files.

```typescript
// Request
{
  v: 1, id: "10", ns: "fs", action: "grep",
  payload: {
    path: "src",
    pattern: "TODO",
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
      { file: "src/utils.ts", line: 10, content: "// TODO: refactor" }
    ]
  }
}
```

---

### Git Namespace (`git`)

#### `git.status` (control)
Get working tree status.

```typescript
// Request
{ v: 1, id: "11", ns: "git", action: "status", payload: {} }

// Response
{
  v: 1, id: "11", ns: "git", action: "status", ok: true,
  payload: {
    branch: "main",
    ahead: 2,
    behind: 0,
    staged: [{ path: "src/index.ts", status: "M" }],
    unstaged: [{ path: "src/utils.ts", status: "M" }],
    untracked: ["src/new-file.ts"]
  }
}
```

#### `git.stage` (control)
Stage files.

```typescript
// Request
{ v: 1, id: "12", ns: "git", action: "stage", payload: { paths: ["src/utils.ts"] } }

// Response
{ v: 1, id: "12", ns: "git", action: "stage", ok: true, payload: {} }
```

#### `git.unstage` (control)
Unstage files.

```typescript
// Request
{ v: 1, id: "13", ns: "git", action: "unstage", payload: { paths: ["src/index.ts"] } }

// Response
{ v: 1, id: "13", ns: "git", action: "unstage", ok: true, payload: {} }
```

#### `git.commit` (control)
Create commit.

```typescript
// Request
{ v: 1, id: "14", ns: "git", action: "commit", payload: { message: "feat: add new feature" } }

// Response
{
  v: 1, id: "14", ns: "git", action: "commit", ok: true,
  payload: { hash: "abc1234", message: "feat: add new feature" }
}
```

#### `git.log` (control)
Get commit history.

```typescript
// Request
{ v: 1, id: "15", ns: "git", action: "log", payload: { limit: 20 } }

// Response
{
  v: 1, id: "15", ns: "git", action: "log", ok: true,
  payload: {
    commits: [
      { hash: "abc1234", message: "feat: add feature", author: "John", date: 1703520000000 },
      { hash: "def5678", message: "fix: bug fix", author: "Jane", date: 1703510000000 }
    ]
  }
}
```

#### `git.diff` (data)
Get diff for file or commit.

```typescript
// Request
{ v: 1, id: "16", ns: "git", action: "diff", payload: { path: "src/index.ts", staged: false } }

// Response
{
  v: 1, id: "16", ns: "git", action: "diff", ok: true,
  payload: { diff: "@@ -1,3 +1,4 @@\n+// new line\n import..." }
}
```

#### `git.branches` (control)
List branches.

```typescript
// Request
{ v: 1, id: "17", ns: "git", action: "branches", payload: {} }

// Response
{
  v: 1, id: "17", ns: "git", action: "branches", ok: true,
  payload: {
    current: "main",
    branches: ["main", "feature/new-ui", "fix/bug-123"]
  }
}
```

#### `git.checkout` (control)
Switch branch.

```typescript
// Request
{ v: 1, id: "18", ns: "git", action: "checkout", payload: { branch: "feature/new-ui" } }

// Response
{ v: 1, id: "18", ns: "git", action: "checkout", ok: true, payload: { branch: "feature/new-ui" } }
```

---

### Terminal Namespace (`terminal`)

#### `terminal.spawn` (control)
Start a new terminal session.

```typescript
// Request
{ v: 1, id: "19", ns: "terminal", action: "spawn", payload: { shell: "/bin/zsh", cols: 80, rows: 24 } }

// Response
{ v: 1, id: "19", ns: "terminal", action: "spawn", ok: true, payload: { terminalId: "term-1" } }
```

#### `terminal.write` (data)
Write to terminal stdin.

```typescript
// Request
{ v: 1, id: "20", ns: "terminal", action: "write", payload: { terminalId: "term-1", data: "ls -la\n" } }

// Response
{ v: 1, id: "20", ns: "terminal", action: "write", ok: true, payload: {} }
```

#### `terminal.output` (data) - Event from CLI
Terminal stdout/stderr output.

```typescript
// Event (CLI → App, no request ID)
{
  v: 1, id: "evt-1", ns: "terminal", action: "output",
  payload: { terminalId: "term-1", data: "total 32\ndrwxr-xr-x..." }
}
```

#### `terminal.resize` (control)
Resize terminal.

```typescript
// Request
{ v: 1, id: "21", ns: "terminal", action: "resize", payload: { terminalId: "term-1", cols: 120, rows: 40 } }

// Response
{ v: 1, id: "21", ns: "terminal", action: "resize", ok: true, payload: {} }
```

#### `terminal.kill` (control)
Kill terminal session.

```typescript
// Request
{ v: 1, id: "22", ns: "terminal", action: "kill", payload: { terminalId: "term-1" } }

// Response
{ v: 1, id: "22", ns: "terminal", action: "kill", ok: true, payload: {} }
```

---

## Proxy Endpoints

### REST

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/v1/session` | Create session, returns `{ code }` |

### WebSocket

| Endpoint | Role | Purpose |
|----------|------|---------|
| `/v1/ws/cli/control?code=XXX` | CLI | Control channel |
| `/v1/ws/cli/data?code=XXX` | CLI | Data channel |
| `/v1/ws/app/control?code=XXX` | App | Control channel |
| `/v1/ws/app/data?code=XXX` | App | Data channel |

---

## Security

### Session Security
- [x] **Crypto-secure codes**: Uses `crypto.randomBytes()` instead of `Math.random()`
- [x] **Session locking**: Once app connects, session is locked - no other app can join (403)
- [x] **Immediate termination**: Either side disconnects → entire session terminated for both
- [x] **Slot protection**: Can't connect to already-taken socket slot (409)

### Security Flow
```
1. CLI creates session, gets code, displays QR
2. App scans QR, connects → session LOCKED
3. Anyone else tries to use same code → 403 "session already in use"
4. Either CLI or App disconnects → both get kicked, session deleted
```

### Future Security (v2)
- [ ] Rate limiting per IP
- [ ] HTTP tunnel authentication

---

## Implementation Checklist

### Phase 1: Proxy Updates
- [x] Update proxy to support dual WebSocket channels (control + data)
- [x] Update session to track 4 sockets (cli-control, cli-data, app-control, app-data)
- [x] Route messages between matching channels (control↔control, data↔data)
- [x] Add channel validation (reject large messages on control channel)

### Phase 2: CLI Updates
- [x] Refactor CLI to connect both channels
- [x] Implement new message protocol (v1, namespaced)
- [x] Add `system.capabilities` handler
- [x] Update `fs.*` handlers to new protocol
- [x] Add `fs.stat`, `fs.mkdir`, `fs.rm`, `fs.mv` handlers
- [x] Add `git.*` handlers (status, stage, unstage, commit, log, diff, branches, checkout)
- [x] Add `terminal.*` handlers (spawn, write, resize, kill, output events)

### Phase 3: App Updates
- [x] Create `ConnectionContext` with dual WebSocket management
- [x] Create message sending/receiving hooks
- [x] Create `useFileSystem` hook for fs operations
- [x] Create `useGit` hook for git operations
- [x] Create `useTerminal` hook for terminal operations
- [x] Update `lunel-link.tsx` to establish connection with scanned code
- [ ] Update editor to load files via `fs.read`
- [ ] Update editor to save files via `fs.write`
- [ ] Add file browser component using `fs.ls`
- [ ] Update git UI to use real `git.*` operations
- [ ] Update terminal to use real `terminal.*` operations

### Phase 4: Polish
- [ ] Add reconnection logic with exponential backoff
- [ ] Add connection status indicators in app
- [ ] Add error handling and user-friendly messages
- [ ] Add loading states for async operations
- [ ] Test end-to-end flow

### Future (v2)
- [ ] HTTP tunnel for browser localhost access
- [ ] Docker namespace (`docker.ps`, `docker.logs`, etc.)
- [ ] Binary frame support for better performance
- [ ] Chunked file transfers for huge files
- [ ] File watch events (`fs.watch`)

---

## Error Codes

| Code | Description |
|------|-------------|
| `ENOENT` | File or directory not found |
| `EACCES` | Permission denied |
| `EEXIST` | File already exists |
| `EISDIR` | Expected file, got directory |
| `ENOTDIR` | Expected directory, got file |
| `ENOTEMPTY` | Directory not empty |
| `EINVAL` | Invalid argument |
| `EPERM` | Operation not permitted |
| `ENOTGIT` | Not a git repository |
| `ECONFLICT` | Merge conflict |
| `ENOTERM` | Terminal not found |

---

## Notes

- All paths are relative to CLI's root directory
- Binary files use base64 encoding in `content` field
- Control channel rejects messages > 64KB
- Data channel has no size limit
- Terminal output is streamed as events (no request ID)
- Git operations require git to be installed on CLI machine
