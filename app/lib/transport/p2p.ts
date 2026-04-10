/**
 * P2P transport — Bare worklet via react-native-bare-kit.
 *
 * Spawns a Bare JS worklet that runs holesail-client with real HyperDHT
 * (native UDP). Communicates over IPC (streamx Duplex):
 *   RN → Worklet: newline-delimited JSON control messages
 *   Worklet → RN: newline-delimited JSON status + raw binary stream frames
 *
 * Architecture:
 *   RN (JS) ◄── IPC (streamx Duplex) ──► Bare Worklet (backend/p2p.js)
 *                                             └─ HolesailClient
 *                                                  └─ HyperDHT (real UDP, native)
 *                                                       └─ noise stream to CLI
 */

import { Worklet } from 'react-native-bare-kit'
import { logger } from '@/lib/logger'

// The bundled Bare worklet (built by `npm run build:worklet`).
// Metro treats .bundle files as raw assets and hands them to us as a Uint8Array.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const p2pBundle = require('../../../backend/p2p.bundle') as Uint8Array

// ── Frame constants (must match CLI side) ────────────────────────────────────
const HEADER_SIZE  = 5
const FRAME_JSON   = 0
const FRAME_BINARY = 1

// ── Types ────────────────────────────────────────────────────────────────────
export type P2PMessageHandler = (
  type: 'json' | 'binary',
  data: string | Uint8Array,
) => Promise<void> | void

export type P2PCloseHandler = (reason: string) => void

export interface P2PConnection {
  send(type: 'json',   data: string): void
  send(type: 'binary', data: Uint8Array): void
  close(): void
}

// ── Frame helpers ─────────────────────────────────────────────────────────────

class FrameReader {
  private buf = new Uint8Array(0)
  constructor(private onFrame: (type: number, payload: Uint8Array) => void) {}

  push(chunk: Uint8Array): void {
    const next = new Uint8Array(this.buf.length + chunk.length)
    next.set(this.buf)
    next.set(chunk, this.buf.length)
    this.buf = next
    this.drain()
  }

  private drain(): void {
    while (this.buf.length >= HEADER_SIZE) {
      const view = new DataView(this.buf.buffer, this.buf.byteOffset, this.buf.byteLength)
      const len  = view.getUint32(0, false)
      if (this.buf.length < HEADER_SIZE + len) break
      const type    = this.buf[4]
      const payload = this.buf.slice(HEADER_SIZE, HEADER_SIZE + len)
      this.buf       = this.buf.slice(HEADER_SIZE + len)
      this.onFrame(type, payload)
    }
  }
}

function encodeFrame(type: 0 | 1, payload: Uint8Array | string): Uint8Array {
  const data = typeof payload === 'string' ? new TextEncoder().encode(payload) : payload
  const buf  = new Uint8Array(HEADER_SIZE + data.length)
  new DataView(buf.buffer).setUint32(0, data.length, false)
  buf[4] = type
  buf.set(data, HEADER_SIZE)
  return buf
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Connect to a CLI peer running HolesailServer.
 *
 * Spawns a Bare worklet that drives holesail-client with real native HyperDHT
 * (no WebSocket relay needed). The worklet exchanges framed data with RN over
 * the IPC Duplex exposed by react-native-bare-kit.
 *
 * @param z32Key    52-char z32 public key shown as QR on the CLI side
 * @param onMessage called for each decoded frame received from the CLI
 * @param onClose   called when the worklet stream closes or errors
 * @returns P2PConnection for sending framed data to the CLI
 */
export async function connectP2P(
  z32Key: string,
  onMessage: P2PMessageHandler,
  onClose: P2PCloseHandler,
): Promise<P2PConnection> {
  const worklet = new Worklet()
  worklet.start('/p2p.bundle', p2pBundle)

  const { IPC } = worklet

  return new Promise<P2PConnection>((resolve, reject) => {
    let connected = false
    let lineBuf = ''

    const reader = new FrameReader((type, payload) => {
      void (async () => {
        try {
          if (type === FRAME_JSON) {
            await onMessage('json', new TextDecoder().decode(payload))
          } else {
            await onMessage('binary', payload)
          }
        } catch (err) {
          logger.warn('p2p', 'frame handler error', { error: String(err) })
        }
      })()
    })

    IPC.on('data', (chunk: Buffer | Uint8Array) => {
      if (!connected) {
        // Parse newline-delimited JSON control messages from the worklet
        lineBuf += Buffer.from(chunk).toString('utf8')
        let nl: number
        while ((nl = lineBuf.indexOf('\n')) !== -1) {
          const line = lineBuf.slice(0, nl)
          lineBuf = lineBuf.slice(nl + 1)
          try {
            const msg = JSON.parse(line) as { status: string; reason?: string }
            if (msg.status === 'connected') {
              connected = true
              logger.info('p2p', 'Bare worklet connected via HyperDHT')
              resolve(conn)
            } else if (msg.status === 'error') {
              reject(new Error(msg.reason ?? 'worklet error'))
            } else if (msg.status === 'closed') {
              onClose('worklet closed')
            }
          } catch { /* not JSON — ignore */ }
        }
        return
      }

      // After connected: raw binary stream frames from the HyperDHT stream
      reader.push(
        chunk instanceof Uint8Array
          ? chunk
          : new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength),
      )
    })

    IPC.on('close', () => onClose('worklet IPC closed'))
    IPC.on('error', (err: Error) => onClose(`worklet IPC error: ${err.message}`))

    const conn: P2PConnection = {
      send(type: 'json' | 'binary', data: string | Uint8Array) {
        const frame = type === 'json'
          ? encodeFrame(FRAME_JSON,   data as string)
          : encodeFrame(FRAME_BINARY, data as Uint8Array)
        IPC.write(Buffer.from(frame.buffer, frame.byteOffset, frame.byteLength))
      },
      close() {
        worklet.terminate()
      },
    }

    // Kick off the connection inside the worklet
    IPC.write(JSON.stringify({ cmd: 'connect', key: z32Key }) + '\n')
  })
}
