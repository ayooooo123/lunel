/**
 * P2P transport for Lunel — app side.
 *
 * Both devices have native UDP available but the RN JS runtime can't bind
 * raw UDP sockets directly. We bridge through a HyperDHT relay WebSocket
 * (run by the Holepunch community) using @hyperswarm/dht-relay, which gives
 * us a full DHT-compatible Node object. We then call node.connect(pubkey)
 * to get the raw noise-encrypted duplex stream that HolesailServer is
 * listening on — no TCP proxy layer, no custom wire protocol.
 *
 * Flow:
 *   WS (relay) → dht-relay Node → node.connect(pubkey) → duplex stream
 *   → FrameReader/FrameWriter → P2PConnection (used by v2.ts)
 *
 * Public relay nodes operated by Holepunch:
 *   wss://relay1.hyperdht.org
 *   wss://relay2.hyperdht.org
 */

import { logger } from '@/lib/logger';

// ── Frame constants (must match CLI side) ────────────────────────────────────
const FRAME_JSON   = 0;
const FRAME_BINARY = 1;
const HEADER_SIZE  = 5;

// ── Public DHT relay endpoints ────────────────────────────────────────────────
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

// ── Frame helpers ─────────────────────────────────────────────────────────────

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
      this.buf       = this.buf.slice(HEADER_SIZE + len);
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

// ── DHT relay connect ─────────────────────────────────────────────────────────
//
// @hyperswarm/dht-relay exposes:
//   new Node(stream)         — takes any duplex, returns a hyperdht-compatible node
//   node.connect(pubKey)     — returns a noise-encrypted duplex stream to the server
//
// We feed it the WS-backed duplex from @hyperswarm/dht-relay/ws (same pkg).

// eslint-disable-next-line @typescript-eslint/no-require-imports
const DhtRelayNode    = require('@hyperswarm/dht-relay') as any;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const DhtRelayWsStream = require('@hyperswarm/dht-relay/ws') as any;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const z32             = require('z32') as any;

async function connectViaDhtRelay(
  z32Key: string,
  relayUrl: string,
): Promise<P2PConnection & { _destroy: () => void }> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const ws = new WebSocket(relayUrl);
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        ws.close();
        reject(new Error(`DHT relay timeout: ${relayUrl}`));
      }
    }, 20_000);

    ws.onopen = () => {
      clearTimeout(timeout);
      if (settled) return;

      try {
        // Wrap the WebSocket in a streamx Duplex for the relay protocol
        const wsStream = new DhtRelayWsStream(true /* isInitiator */, ws);

        // Create a relay-backed DHT node — same API as real HyperDHT
        const node = new DhtRelayNode(wsStream);

        // Decode the z32 key to a 32-byte public key buffer
        const pubKey: Uint8Array = z32.decode(z32Key);

        // Connect — returns a noise-encrypted duplex stream (streamx Duplex)
        // This is the same stream that HolesailServer exposes to handleTCP
        const duplexStream = node.connect(pubKey);

        // Wait for the noise handshake to complete (stream.opened promise)
        Promise.resolve(duplexStream.opened ?? Promise.resolve()).then(() => {
          if (settled) { duplexStream.destroy(); return; }
          settled = true;

          logger.info('p2p', 'DHT relay stream opened', { relay: relayUrl });

          const conn: P2PConnection & {
            _destroy: () => void;
            onMessage?: P2PMessageHandler;
            onClose?: P2PCloseHandler;
          } = {
            send(type: 'json' | 'binary', data: string | Uint8Array) {
              const frame = type === 'json'
                ? encodeFrame(FRAME_JSON,   data as string)
                : encodeFrame(FRAME_BINARY, data as Uint8Array);
              duplexStream.write(Buffer.from(frame.buffer, frame.byteOffset, frame.byteLength));
            },
            close() {
              duplexStream.destroy();
              node.destroy().catch(() => {});
            },
            _destroy() {
              duplexStream.destroy();
              node.destroy().catch(() => {});
              ws.close();
            },
          };

          // Wire stream events now that conn is declared
          const reader = new FrameReader((type, payload) => {
            void (async () => {
              try {
                if (type === FRAME_JSON) {
                  await conn.onMessage?.('json', new TextDecoder().decode(payload));
                } else {
                  await conn.onMessage?.('binary', payload);
                }
              } catch (err) {
                logger.warn('p2p', 'frame handler error', {
                  error: err instanceof Error ? err.message : String(err),
                });
              }
            })();
          });

          duplexStream.on('data', (chunk: Buffer | Uint8Array) => {
            reader.push(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength));
          });

          duplexStream.on('close', () => conn.onClose?.('DHT stream closed'));
          duplexStream.on('error', (err: Error) => conn.onClose?.(`DHT stream error: ${err.message}`));

          resolve(conn);
        }).catch((err: Error) => {
          if (!settled) {
            settled = true;
            duplexStream.destroy();
            node.destroy().catch(() => {});
            reject(err);
          }
        });
      } catch (err) {
        if (!settled) {
          settled = true;
          ws.close();
          reject(err);
        }
      }
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      if (!settled) {
        settled = true;
        reject(new Error(`DHT relay WS error: ${relayUrl}`));
      }
    };

    ws.onclose = (e: CloseEvent) => {
      clearTimeout(timeout);
      if (!settled) {
        settled = true;
        reject(new Error(`DHT relay WS closed early: ${(e as any).code}`));
      }
    };
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Connect to a CLI peer running HolesailServer.
 *
 * @param z32Key    - 52-char z32 key shown as QR on the CLI
 * @param onMessage - called for each decoded frame from the CLI
 * @param onClose   - called when the stream closes
 * @returns P2PConnection for sending framed data back to the CLI
 */
export async function connectP2P(
  z32Key: string,
  onMessage: P2PMessageHandler,
  onClose:   P2PCloseHandler,
): Promise<P2PConnection> {
  let lastError: Error | null = null;

  for (const relayUrl of RELAY_URLS) {
    try {
      logger.info('p2p', 'trying DHT relay', { relay: relayUrl, key: z32Key.slice(0, 8) + '…' });

      const conn = await connectViaDhtRelay(z32Key, relayUrl);

      // Wire up the handlers now that we have a connection object
      (conn as any).onMessage = onMessage;
      (conn as any).onClose   = onClose;

      logger.info('p2p', 'DHT relay connected — raw stream to CLI', { relay: relayUrl });
      return conn;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      logger.warn('p2p', 'relay failed, trying next', {
        relay: relayUrl,
        error: lastError.message,
      });
    }
  }

  throw lastError ?? new Error('All DHT relay nodes failed');
}
