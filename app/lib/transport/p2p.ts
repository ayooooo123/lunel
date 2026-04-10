/**
 * P2P transport for Lunel — app side.
 *
 * The CLI runs a HolesailServer (holesail library). The app cannot run
 * holesail-client directly (HyperDHT uses native UDP unavailable in RN),
 * so we connect via a HyperDHT WebSocket relay. The relay speaks the same
 * HyperDHT wire protocol on our behalf and hands us back a duplex stream
 * identical to what holesail exposes on the server side.
 *
 * Public relay nodes operated by Holepunch / the community:
 *   wss://relay1.hyperdht.org
 *   wss://relay2.hyperdht.org
 *
 * Wire protocol over the relay WebSocket (after the relay delivers the stream):
 * Same length-prefixed framing as cli/src/transport/v2.ts:
 *   [4 bytes BE uint32: payload length][1 byte: 0=json 1=binary][payload]
 */

import { logger } from '@/lib/logger';

// ── Frame constants (must match CLI side) ────────────────────────────────────
const FRAME_JSON   = 0;
const FRAME_BINARY = 1;
const HEADER_SIZE  = 5;

// ── Public Holesail/HyperDHT relay endpoints ─────────────────────────────────
const RELAY_URLS = [
  'wss://relay1.hyperdht.org',
  'wss://relay2.hyperdht.org',
  'wss://dht1.hyperdht.org',
  'wss://dht2.hyperdht.org',
];

// ── Types ────────────────────────────────────────────────────────────────────
export type P2PMessageHandler = (
  type: 'json' | 'binary',
  data: string | Uint8Array,
) => Promise<void> | void;

export type P2PCloseHandler = (reason: string) => void;

export interface P2PConnection {
  send(type: 'json',   data: string): void;
  send(type: 'binary', data: Uint8Array): void;
  close(): void;
}

// ── Frame reader ─────────────────────────────────────────────────────────────

class FrameReader {
  private buf = new Uint8Array(0);
  constructor(private onFrame: (type: number, payload: Uint8Array) => void) {}

  push(chunk: Uint8Array): void {
    const next = new Uint8Array(this.buf.length + chunk.length);
    next.set(this.buf);
    next.set(chunk, this.buf.length);
    this.buf = next;
    this.drain();
  }

  private drain(): void {
    while (this.buf.length >= HEADER_SIZE) {
      const view = new DataView(this.buf.buffer, this.buf.byteOffset, this.buf.byteLength);
      const len  = view.getUint32(0, false);
      if (this.buf.length < HEADER_SIZE + len) break;
      const type    = this.buf[4];
      const payload = this.buf.slice(HEADER_SIZE, HEADER_SIZE + len);
      this.buf = this.buf.slice(HEADER_SIZE + len);
      this.onFrame(type, payload);
    }
  }
}

function encodeFrame(type: 0 | 1, payload: Uint8Array | string): Uint8Array {
  const data = typeof payload === 'string' ? new TextEncoder().encode(payload) : payload;
  const buf  = new Uint8Array(HEADER_SIZE + data.length);
  new DataView(buf.buffer).setUint32(0, data.length, false);
  buf[4] = type;
  buf.set(data, HEADER_SIZE);
  return buf;
}

// ── Relay connect ─────────────────────────────────────────────────────────────
// The relay WebSocket protocol:
//   1. App  → relay: JSON { type: 'connect', key: '<z32 key>' }
//   2. relay → app:  JSON { type: 'connected' }  (relay found the peer)
//   3. All subsequent binary messages are raw stream data (our framed protocol)
//
// This matches the protocol used by hyperswarm-dht-relay ws.js transport and
// is compatible with both Holepunch's public relay nodes and self-hosted ones.

async function connectViaRelay(
  z32Key: string,
  relayUrl: string,
): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const ws = new WebSocket(relayUrl);
    ws.binaryType = 'arraybuffer';

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        ws.close();
        reject(new Error(`Relay timeout: ${relayUrl}`));
      }
    }, 15_000);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'connect', key: z32Key }));
    };

    ws.onmessage = (event) => {
      if (typeof event.data !== 'string') return;
      try {
        const msg = JSON.parse(event.data) as { type?: string; reason?: string };
        if (msg.type === 'connected') {
          clearTimeout(timeout);
          if (!settled) { settled = true; resolve(ws); }
        } else if (msg.type === 'error') {
          clearTimeout(timeout);
          if (!settled) { settled = true; ws.close(); reject(new Error(msg.reason ?? 'relay error')); }
        }
      } catch { /* ignore non-JSON */ }
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      if (!settled) { settled = true; reject(new Error(`Relay WS error: ${relayUrl}`)); }
    };

    ws.onclose = (e) => {
      clearTimeout(timeout);
      if (!settled) { settled = true; reject(new Error(`Relay closed: ${e.code}`)); }
    };
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Connect to a CLI peer running HolesailServer.
 *
 * @param z32Key     - 52-char z32 key shown as QR on CLI
 * @param onMessage  - called for each decoded frame
 * @param onClose    - called when stream closes
 * @returns P2PConnection for sending framed data
 */
export async function connectP2P(
  z32Key: string,
  onMessage: P2PMessageHandler,
  onClose:   P2PCloseHandler,
): Promise<P2PConnection> {
  let lastError: Error | null = null;

  for (const relayUrl of RELAY_URLS) {
    try {
      logger.info('p2p', 'trying Holesail relay', { relayUrl, key: z32Key.slice(0, 8) + '…' });

      const ws = await connectViaRelay(z32Key, relayUrl);
      logger.info('p2p', 'Holesail relay connected', { relayUrl });

      const reader = new FrameReader((type, payload) => {
        void (async () => {
          try {
            if (type === FRAME_JSON) {
              await onMessage('json', new TextDecoder().decode(payload));
            } else {
              await onMessage('binary', payload);
            }
          } catch (err) {
            logger.warn('p2p', 'frame handler error', {
              error: err instanceof Error ? err.message : String(err),
            });
          }
        })();
      });

      // After handshake, all binary messages are our framed protocol
      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          reader.push(new Uint8Array(event.data));
        }
        // string messages handled during connect phase only
      };

      ws.onclose = (e) => onClose(`Holesail relay closed (${e.code}: ${e.reason})`);
      ws.onerror = ()  => onClose('Holesail relay WebSocket error');

      return {
        send(type: 'json' | 'binary', data: string | Uint8Array) {
          const frame = type === 'json'
            ? encodeFrame(FRAME_JSON,   data as string)
            : encodeFrame(FRAME_BINARY, data as Uint8Array);
          ws.send(frame.buffer.slice(frame.byteOffset, frame.byteOffset + frame.byteLength));
        },
        close() { ws.close(); },
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      logger.warn('p2p', 'relay failed, trying next', { relayUrl, error: lastError.message });
    }
  }

  throw lastError ?? new Error('All Holesail relay nodes failed');
}
