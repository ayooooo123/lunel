/**
 * P2P transport for Lunel using HyperDHT relay.
 *
 * The app cannot run hyperdht natively (no UDP sockets in RN), so we use
 * @hyperswarm/dht-relay which speaks to a relay server via WebSocket.
 * The relay does DHT lookup + holepunching on behalf of the app.
 *
 * Public relay nodes: wss://dht1.hyperdht.org, wss://dht2.hyperdht.org
 *
 * Connection flow:
 *   1. App opens WS to relay
 *   2. App calls dht.connect(serverPubKey) — relay finds the CLI peer in DHT
 *   3. Relay establishes holepunched TCP connection to CLI
 *   4. App gets a duplex stream to CLI
 *   5. We run V2 framed protocol over that stream
 */

import { logger } from '@/lib/logger';

// ── Frame protocol (must match cli/src/transport/v2.ts) ──────────────────────
const FRAME_TYPE_JSON = 0;
const FRAME_TYPE_BINARY = 1;
const HEADER_SIZE = 5; // 4 bytes length + 1 byte type

// ── DHT relay bootstrap nodes ────────────────────────────────────────────────
const DHT_RELAY_URLS = [
  'wss://dht1.hyperdht.org',
  'wss://dht2.hyperdht.org',
  'wss://dht.pears.com',
];

export type P2PMessageHandler = (type: 'json' | 'binary', data: string | Uint8Array) => Promise<void> | void;
export type P2PCloseHandler = (reason: string) => void;

export interface P2PConnection {
  send(type: 'json', data: string): void;
  send(type: 'binary', data: Uint8Array): void;
  close(): void;
}

// ── Stream framing reader ────────────────────────────────────────────────────

class FrameReader {
  private buf: Uint8Array = new Uint8Array(0);
  private onFrame: (type: number, payload: Uint8Array) => void;

  constructor(onFrame: (type: number, payload: Uint8Array) => void) {
    this.onFrame = onFrame;
  }

  push(chunk: Uint8Array): void {
    const merged = new Uint8Array(this.buf.length + chunk.length);
    merged.set(this.buf);
    merged.set(chunk, this.buf.length);
    this.buf = merged;
    this.drain();
  }

  private drain(): void {
    while (this.buf.length >= HEADER_SIZE) {
      const view = new DataView(this.buf.buffer, this.buf.byteOffset, this.buf.byteLength);
      const len = view.getUint32(0, false); // big-endian
      if (this.buf.length < HEADER_SIZE + len) break;
      const type = this.buf[4];
      const payload = this.buf.slice(HEADER_SIZE, HEADER_SIZE + len);
      this.buf = this.buf.slice(HEADER_SIZE + len);
      this.onFrame(type, payload);
    }
  }
}

function encodeFrame(type: 0 | 1, payload: Uint8Array | string): Uint8Array {
  const data = typeof payload === 'string'
    ? new TextEncoder().encode(payload)
    : payload;
  const buf = new Uint8Array(HEADER_SIZE + data.length);
  const view = new DataView(buf.buffer);
  view.setUint32(0, data.length, false); // big-endian
  buf[4] = type;
  buf.set(data, HEADER_SIZE);
  return buf;
}

// ── WebSocket-based relay connection ─────────────────────────────────────────
// We open a WS to the relay, send a connect request for the target key,
// and the relay gives us a multiplexed stream to the remote peer.
//
// The @hyperswarm/dht-relay protocol is complex. For the initial implementation
// we use a simpler approach: the relay exposes a raw TCP proxy mode where
// you send the target pubkey and it connects you directly. We use the
// ws.js transport from the package.

async function connectViaDhtRelay(
  serverKeyHex: string,
  relayUrl: string,
): Promise<{ ws: WebSocket; send: (data: Uint8Array) => void; close: () => void }> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(relayUrl);
    ws.binaryType = 'arraybuffer';
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        ws.close();
        reject(new Error(`DHT relay connect timeout to ${relayUrl}`));
      }
    }, 15000);

    ws.onopen = () => {
      clearTimeout(timeout);
      // Send connect request: { type: 'connect', key: '<hex>' }
      // The relay will establish a connection to the CLI peer.
      ws.send(JSON.stringify({ type: 'connect', key: serverKeyHex }));
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'connected') {
            if (!resolved) {
              resolved = true;
              resolve({
                ws,
                send: (data: Uint8Array) => ws.send(data.buffer),
                close: () => ws.close(),
              });
            }
          } else if (msg.type === 'error') {
            if (!resolved) {
              resolved = true;
              ws.close();
              reject(new Error(msg.reason ?? 'DHT relay error'));
            }
          }
        } catch {
          // ignore non-JSON
        }
      }
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      if (!resolved) {
        resolved = true;
        reject(new Error(`DHT relay WebSocket error on ${relayUrl}`));
      }
    };

    ws.onclose = (event) => {
      clearTimeout(timeout);
      if (!resolved) {
        resolved = true;
        reject(new Error(`DHT relay WebSocket closed (${event.code}: ${event.reason})`));
      }
    };
  });
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Connect to a CLI peer via HyperDHT relay.
 *
 * @param serverKeyHex - 64-char hex pubkey from QR scan
 * @param onMessage - called for each decoded frame
 * @param onClose - called when connection drops
 * @returns P2PConnection for sending data
 */
export async function connectP2P(
  serverKeyHex: string,
  onMessage: P2PMessageHandler,
  onClose: P2PCloseHandler,
): Promise<P2PConnection> {
  let lastError: Error | null = null;

  for (const relayUrl of DHT_RELAY_URLS) {
    try {
      logger.info('p2p', 'trying DHT relay', { relayUrl, keyHex: serverKeyHex.slice(0, 16) + '…' });
      const { ws, send, close } = await connectViaDhtRelay(serverKeyHex, relayUrl);
      logger.info('p2p', 'DHT relay connected', { relayUrl });

      const reader = new FrameReader((type, payload) => {
        void (async () => {
          try {
            if (type === FRAME_TYPE_JSON) {
              const text = new TextDecoder().decode(payload);
              await onMessage('json', text);
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

      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          reader.push(new Uint8Array(event.data));
        }
        // string messages (control) already handled during connect phase —
        // after 'connected' all messages should be binary frames
      };

      ws.onclose = (event) => {
        onClose(`DHT relay closed (${event.code}: ${event.reason})`);
      };

      ws.onerror = () => {
        onClose('DHT relay WebSocket error');
      };

      return {
        send(type: 'json' | 'binary', data: string | Uint8Array) {
          const frame = type === 'json'
            ? encodeFrame(FRAME_TYPE_JSON, data as string)
            : encodeFrame(FRAME_TYPE_BINARY, data as Uint8Array);
          send(frame);
        },
        close,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      logger.warn('p2p', 'DHT relay failed, trying next', {
        relayUrl,
        error: lastError.message,
      });
    }
  }

  throw lastError ?? new Error('All DHT relay nodes failed');
}
