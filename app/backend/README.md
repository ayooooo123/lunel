# backend/

This directory contains the Bare worklet source and (after building) its bundle.

## Files

- `p2p.js` — Bare worklet source. Runs inside a native Bare thread via
  `react-native-bare-kit`. Uses `holesail-client` with real HyperDHT (native
  UDP) to connect to a peer running HolesailServer on the CLI side.

- `p2p.bundle` — **generated build artifact** (not committed). Built from
  `p2p.js` by `bare-pack`. Regenerated automatically as part of the native
  build, or manually with:

  ```sh
  npm run build:worklet
  ```

  which runs:

  ```sh
  bare-pack --linked --host android --host ios -o backend/p2p.bundle backend/p2p.js
  ```

## How the worklet is loaded

`app/lib/transport/p2p.ts` requires `../../../backend/p2p.bundle` at bundle
time (Metro treats the `.bundle` file as a raw asset / Uint8Array). At runtime
it calls `new Worklet()` + `worklet.start('/p2p.bundle', p2pBundle)` which
spawns the Bare thread and returns the IPC Duplex for bidirectional
communication.

## IPC protocol

```
RN  →  Worklet  (newline-delimited JSON)
  { cmd: 'connect', key: '<z32 key>' }

Worklet  →  RN  (newline-delimited JSON, then raw binary)
  { status: 'connected' }           — HyperDHT stream is open
  { status: 'error', reason: '…' }  — connection failed
  { status: 'closed' }              — stream closed

After 'connected': all bytes in both directions are raw framed stream data
(5-byte header: 4-byte big-endian length + 1-byte type, then payload).
```
