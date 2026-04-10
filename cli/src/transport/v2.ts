import { WebSocket } from "ws";
import { createRequire } from "module";
import type { Duplex } from "stream";
import type {
  EncryptedProtocolEnvelope,
  EventMessage,
  Message,
  Response,
  SystemMessage,
  V2HandshakeFrame,
} from "./protocol.js";
import {
  V2_FRAME_ENCRYPTED_MESSAGE,
  buildSessionV2WsUrl,
  decodeV2BinaryFrame,
  encodeV2EncryptedFrame,
  isEncryptedProtocolEnvelope,
  isProtocolRequest,
  isProtocolResponse,
  isV2HandshakeFrame,
} from "./protocol.js";

type TransportState = "idle" | "connecting" | "open" | "handshaking" | "secure" | "closed";
type SodiumModule = typeof import("libsodium-wrappers");

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const require = createRequire(import.meta.url);
const sodium = require("libsodium-wrappers") as SodiumModule;

export interface V2TransportHandlers {
  onSystemMessage: (message: SystemMessage) => Promise<void> | void;
  onProtocolRequest: (message: Message) => Promise<Response>;
  onProtocolResponse?: (message: Response) => Promise<void> | void;
  onProtocolEvent?: (message: EventMessage) => Promise<void> | void;
  onClose: (reason: string) => void;
}

export interface V2TransportOptions {
  gatewayUrl?: string;
  password?: string;
  sessionSecret?: string;
  generation?: number | null;
  role: "cli" | "app";
  handlers: V2TransportHandlers;
  debugLog?: (message: string, ...args: unknown[]) => void;
}

interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

interface SessionKeys {
  rx: Uint8Array;
  tx: Uint8Array;
}

interface SessionBootstrapPayload {
  c2s: string;
  s2c: string;
}

function toUint8Array(data: WebSocket.RawData): Uint8Array {
  if (data instanceof Uint8Array) return data;
  if (Array.isArray(data)) return new Uint8Array(Buffer.concat(data.map((chunk) => Buffer.from(chunk))));
  return new Uint8Array(data as ArrayBufferLike);
}

function encodeUtf8(value: string): Uint8Array {
  return encoder.encode(value);
}

function decodeUtf8(value: Uint8Array): string {
  return decoder.decode(value);
}

// ─── Stream framing ────────────────────────────────────────────────────────
// Holesail gives us a raw duplex stream (TCP-like). We use a simple
// length-prefixed framing:
//   [4 bytes big-endian uint32: payload length][1 byte: type 0=json 1=binary][payload]
// This matches what the app side expects.

const FRAME_TYPE_JSON = 0;
const FRAME_TYPE_BINARY = 1;

function encodeStreamFrame(type: 0 | 1, payload: Buffer | Uint8Array): Buffer {
  const buf = Buffer.from(payload);
  const header = Buffer.allocUnsafe(5);
  header.writeUInt32BE(buf.length, 0);
  header[4] = type;
  return Buffer.concat([header, buf]);
}

class StreamFrameReader {
  private buf = Buffer.alloc(0);
  private onFrame: (type: number, payload: Buffer) => void;

  constructor(onFrame: (type: number, payload: Buffer) => void) {
    this.onFrame = onFrame;
  }

  push(chunk: Buffer): void {
    this.buf = Buffer.concat([this.buf, chunk]);
    this.drain();
  }

  private drain(): void {
    while (this.buf.length >= 5) {
      const len = this.buf.readUInt32BE(0);
      if (this.buf.length < 5 + len) break;
      const type = this.buf[4];
      const payload = this.buf.slice(5, 5 + len);
      this.buf = this.buf.slice(5 + len);
      this.onFrame(type, payload);
    }
  }
}

export class V2SessionTransport {
  private readonly options: V2TransportOptions;
  private ws: WebSocket | null = null;
  private stream: Duplex | null = null;
  private closed = false;
  private state: TransportState = "idle";
  private keyPair: KeyPair | null = null;
  private remotePublicKey: Uint8Array | null = null;
  private sessionKeys: SessionKeys | null = null;
  private secureReadyResolve: (() => void) | null = null;
  private secureReadyReject: ((error: Error) => void) | null = null;
  private secureReadyPromise: Promise<void> | null = null;

  constructor(options: V2TransportOptions) {
    this.options = options;
  }

  // ── WebSocket-based connect (original gateway mode) ──────────────────────
  async connect(): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      if (this.secureReadyPromise) {
        return await this.secureReadyPromise;
      }
      return;
    }

    await sodium.ready;
    this.secureReadyPromise = new Promise<void>((resolve, reject) => {
      this.secureReadyResolve = resolve;
      this.secureReadyReject = reject;
    });

    const wsUrl = buildSessionV2WsUrl(
      this.options.gatewayUrl!,
      this.options.role,
      this.options.password!,
      this.options.generation,
    );

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      let opened = false;
      this.ws = ws;
      this.closed = false;
      this.state = "connecting";

      ws.on("open", () => {
        opened = true;
        this.state = "open";
        resolve();
      });

      ws.on("message", async (data, isBinary) => {
        try {
          await this.handleMessage(data, isBinary);
        } catch (error) {
          this.options.debugLog?.("[transport:v2] message handling failed", error);
          this.failSecure(new Error(error instanceof Error ? error.message : String(error)));
          this.close();
        }
      });

      ws.on("close", (code, reason) => {
        this.ws = null;
        this.state = "closed";
        if (!opened) {
          reject(new Error(`v2 socket closed during setup (${code}: ${reason.toString()})`));
          return;
        }
        if (!this.closed) {
          this.closed = true;
          this.failSecure(new Error(`v2 socket closed (${code}: ${reason.toString()})`));
          this.options.handlers.onClose(`v2 socket closed (${code}: ${reason.toString()})`);
        }
      });

      ws.on("error", (error) => {
        if (!opened) {
          reject(new Error(`v2 socket error: ${error.message}`));
          return;
        }
        this.options.debugLog?.("[transport:v2] websocket error", error.message);
      });
    });

    if (!this.secureReadyPromise) {
      throw new Error("secure readiness promise missing");
    }
    await this.secureReadyPromise;
  }

  // ── HyperDHT stream-based connect (P2P mode) ─────────────────────────────
  async connectStream(duplex: Duplex): Promise<void> {
    await sodium.ready;

    this.secureReadyPromise = new Promise<void>((resolve, reject) => {
      this.secureReadyResolve = resolve;
      this.secureReadyReject = reject;
    });

    this.stream = duplex;
    this.closed = false;
    this.state = "open";

    const reader = new StreamFrameReader((type, payload) => {
      void (async () => {
        try {
          if (type === FRAME_TYPE_JSON) {
            const text = payload.toString("utf-8");
            const raw = JSON.parse(text) as SystemMessage | Message | Response | V2HandshakeFrame;
            await this.handleParsedJson(raw);
          } else {
            await this.handleMessage(payload as unknown as WebSocket.RawData, true);
          }
        } catch (error) {
          this.options.debugLog?.("[transport:v2:stream] message handling failed", error);
          this.failSecure(new Error(error instanceof Error ? error.message : String(error)));
          this.close();
        }
      })();
    });

    duplex.on("data", (chunk: Buffer) => reader.push(chunk));

    duplex.on("close", () => {
      this.stream = null;
      this.state = "closed";
      if (!this.closed) {
        this.closed = true;
        this.failSecure(new Error("DHT stream closed"));
        this.options.handlers.onClose("DHT stream closed");
      }
    });

    duplex.on("error", (err) => {
      this.options.debugLog?.("[transport:v2:stream] stream error", err.message);
      if (!this.closed) {
        this.closed = true;
        this.stream = null;
        this.state = "closed";
        this.failSecure(err);
        this.options.handlers.onClose(`DHT stream error: ${err.message}`);
      }
    });

    // CLI (server) role: emit peer_connected system message immediately so the
    // upper layer knows a peer arrived and kicks off the handshake.
    if (this.options.role === "cli") {
      await this.options.handlers.onSystemMessage({ type: "peer_connected", role: "app" });
      // CLI waits for client_hello — don't initiate.
    } else {
      // App role: initiate handshake
      this.resetPeerSession();
      await this.maybeStartHandshake();
    }

    await this.secureReadyPromise;
  }

  private async handleParsedJson(raw: SystemMessage | Message | Response | V2HandshakeFrame): Promise<void> {
    if ("type" in raw) {
      await this.options.handlers.onSystemMessage(raw);
      if (raw.type === "peer_connected") {
        this.resetPeerSession();
        await this.maybeStartHandshake();
      } else if (raw.type === "peer_disconnected" || raw.type === "app_disconnected") {
        this.resetPeerSession();
      }
      return;
    }

    if (isV2HandshakeFrame(raw)) {
      await this.handleHandshakeFrame(raw);
      return;
    }

    throw new Error(
      this.state === "secure"
        ? "received plaintext app message after secure transport"
        : "received plaintext app message before secure transport",
    );
  }

  async sendMessage(message: Message): Promise<void> {
    const ciphertext = this.encryptEnvelope({ kind: "request", message });
    this.sendBinaryFrame(ciphertext);
  }

  async sendResponse(response: Response): Promise<void> {
    const ciphertext = this.encryptEnvelope({ kind: "response", message: response });
    this.sendBinaryFrame(ciphertext);
  }

  async sendEvent(message: EventMessage): Promise<void> {
    const ciphertext = this.encryptEnvelope({ kind: "event", message });
    this.sendBinaryFrame(ciphertext);
  }

  close(): void {
    this.closed = true;
    this.state = "closed";
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
    if (this.stream) {
      try { this.stream.destroy(); } catch { /* ignore */ }
      this.stream = null;
    }
  }

  isSecure(): boolean {
    return this.state === "secure";
  }

  private async handleMessage(data: WebSocket.RawData, isBinary: boolean): Promise<void> {
    if (!isBinary) {
      const text = typeof data === "string" ? data : Buffer.from(data as ArrayBufferLike).toString("utf-8");
      const raw = JSON.parse(text) as SystemMessage | Message | Response | V2HandshakeFrame;
      await this.handleParsedJson(raw);
      return;
    }

    const bytes = toUint8Array(data);
    const frame = decodeV2BinaryFrame(bytes);
    if (!frame) {
      throw new Error("invalid binary v2 frame");
    }
    if (frame.type !== V2_FRAME_ENCRYPTED_MESSAGE) {
      throw new Error(`unsupported v2 frame type ${frame.type}`);
    }
    if (this.state !== "secure" || !this.sessionKeys) {
      throw new Error("received encrypted frame before secure transport");
    }
    if (frame.payload.length < sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES) {
      throw new Error("encrypted frame missing nonce");
    }

    const nonce = frame.payload.subarray(0, sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
    const ciphertext = frame.payload.subarray(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
    const plaintext = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null,
      ciphertext,
      null,
      nonce,
      this.sessionKeys.rx,
    ) as Uint8Array;

    const parsed = JSON.parse(decodeUtf8(plaintext)) as EncryptedProtocolEnvelope;
    if (!isEncryptedProtocolEnvelope(parsed)) {
      throw new Error("invalid decrypted protocol envelope");
    }
    if (parsed.kind === "response") {
      await this.options.handlers.onProtocolResponse?.(parsed.message);
      return;
    }
    if (parsed.kind === "event") {
      await this.options.handlers.onProtocolEvent?.(parsed.message);
      return;
    }
    if (parsed.kind === "request") {
      const response = await this.options.handlers.onProtocolRequest(parsed.message);
      await this.sendResponse(response);
      return;
    }
    throw new Error("invalid decrypted protocol envelope");
  }

  private async maybeStartHandshake(): Promise<void> {
    if (this.state === "secure" || this.state === "handshaking") return;
    if (this.options.role !== "app") return;
    this.state = "handshaking";

    const keyPair = this.ensureKeyPair();
    const hello: V2HandshakeFrame = {
      t: "lunel_v2",
      kind: "client_hello",
      pubkey: sodium.to_base64(keyPair.publicKey, sodium.base64_variants.URLSAFE_NO_PADDING),
    };
    this.sendJsonFrame(hello);
  }

  private async handleHandshakeFrame(frame: V2HandshakeFrame): Promise<void> {
    this.state = "handshaking";
    if (frame.kind === "client_hello") {
      if (this.options.role !== "cli") {
        throw new Error("unexpected client_hello on app transport");
      }
      this.remotePublicKey = sodium.from_base64(frame.pubkey, sodium.base64_variants.URLSAFE_NO_PADDING);
      const keyPair = this.ensureKeyPair();
      this.sendJsonFrame({
        t: "lunel_v2",
        kind: "server_hello",
        pubkey: sodium.to_base64(keyPair.publicKey, sodium.base64_variants.URLSAFE_NO_PADDING),
      });
      return;
    }

    if (frame.kind === "server_hello") {
      if (this.options.role !== "app") {
        throw new Error("unexpected server_hello on cli transport");
      }
      this.remotePublicKey = sodium.from_base64(frame.pubkey, sodium.base64_variants.URLSAFE_NO_PADDING);
      const keyPair = this.ensureKeyPair();
      const c2sKey = sodium.crypto_aead_xchacha20poly1305_ietf_keygen() as Uint8Array;
      const s2cKey = sodium.crypto_aead_xchacha20poly1305_ietf_keygen() as Uint8Array;
      const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES) as Uint8Array;
      const payload: SessionBootstrapPayload = {
        c2s: sodium.to_base64(c2sKey, sodium.base64_variants.URLSAFE_NO_PADDING),
        s2c: sodium.to_base64(s2cKey, sodium.base64_variants.URLSAFE_NO_PADDING),
      };
      const boxed = sodium.crypto_box_easy(
        encodeUtf8(JSON.stringify(payload)),
        nonce,
        this.remotePublicKey,
        keyPair.privateKey,
      ) as Uint8Array;
      const auth = this.computeHandshakeAuth(
        "client_key",
        "app",
        sodium.to_base64(keyPair.publicKey, sodium.base64_variants.URLSAFE_NO_PADDING),
        nonce,
        boxed,
      );

      this.sessionKeys = { rx: s2cKey, tx: c2sKey };
      this.sendJsonFrame({
        t: "lunel_v2",
        kind: "client_key",
        nonce: sodium.to_base64(nonce, sodium.base64_variants.URLSAFE_NO_PADDING),
        box: sodium.to_base64(boxed, sodium.base64_variants.URLSAFE_NO_PADDING),
        auth,
      });
      return;
    }

    if (frame.kind === "client_key") {
      if (this.options.role !== "cli") {
        throw new Error("unexpected client_key on app transport");
      }
      if (!this.remotePublicKey) {
        throw new Error("missing client public key before client_key");
      }

      const keyPair = this.ensureKeyPair();
      const nonce = sodium.from_base64(frame.nonce, sodium.base64_variants.URLSAFE_NO_PADDING);
      const boxed = sodium.from_base64(frame.box, sodium.base64_variants.URLSAFE_NO_PADDING);
      const expectedAuth = this.computeHandshakeAuth(
        "client_key",
        "app",
        sodium.to_base64(this.remotePublicKey, sodium.base64_variants.URLSAFE_NO_PADDING),
        nonce,
        boxed,
      );
      if (frame.auth !== expectedAuth) {
        throw new Error("client_key authentication failed");
      }
      const opened = sodium.crypto_box_open_easy(
        boxed,
        nonce,
        this.remotePublicKey,
        keyPair.privateKey,
      ) as Uint8Array;
      const payloadParsed = JSON.parse(decodeUtf8(opened)) as SessionBootstrapPayload;
      this.sessionKeys = {
        rx: sodium.from_base64(payloadParsed.c2s, sodium.base64_variants.URLSAFE_NO_PADDING),
        tx: sodium.from_base64(payloadParsed.s2c, sodium.base64_variants.URLSAFE_NO_PADDING),
      };
      const auth = this.computeHandshakeAuth(
        "server_ready",
        "cli",
        sodium.to_base64(keyPair.publicKey, sodium.base64_variants.URLSAFE_NO_PADDING),
      );
      this.sendJsonFrame({
        t: "lunel_v2",
        kind: "server_ready",
        auth,
      });
      this.markSecure();
      return;
    }

    if (frame.kind === "server_ready") {
      if (this.options.role !== "app") {
        throw new Error("unexpected server_ready on cli transport");
      }
      if (!this.sessionKeys) {
        throw new Error("missing session keys before server_ready");
      }
      const expectedAuth = this.computeHandshakeAuth(
        "server_ready",
        "cli",
        sodium.to_base64(this.remotePublicKey, sodium.base64_variants.URLSAFE_NO_PADDING),
      );
      if (frame.auth !== expectedAuth) {
        throw new Error("server_ready authentication failed");
      }
      this.markSecure();
    }
  }

  private sendJsonFrame(value: unknown): void {
    const text = JSON.stringify(value);
    if (this.stream) {
      this.stream.write(encodeStreamFrame(FRAME_TYPE_JSON, Buffer.from(text, "utf-8")));
    } else if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(text);
    }
  }

  private sendBinaryFrame(data: Uint8Array): void {
    if (this.stream) {
      this.stream.write(encodeStreamFrame(FRAME_TYPE_BINARY, Buffer.from(data)));
    } else if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  private encryptEnvelope(envelope: EncryptedProtocolEnvelope): Uint8Array {
    if (!this.sessionKeys) throw new Error("session keys not established");
    const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES) as Uint8Array;
    const plaintext = encodeUtf8(JSON.stringify(envelope));
    const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      plaintext,
      null,
      null,
      nonce,
      this.sessionKeys.tx,
    ) as Uint8Array;
    return encodeV2EncryptedFrame(new Uint8Array([...nonce, ...ciphertext]));
  }

  private ensureKeyPair(): KeyPair {
    if (!this.keyPair) {
      this.keyPair = sodium.crypto_box_keypair() as KeyPair;
    }
    return this.keyPair;
  }

  private resetPeerSession(): void {
    this.keyPair = null;
    this.remotePublicKey = null;
    this.sessionKeys = null;
    if (this.state !== "closed") {
      this.state = "open";
    }
  }

  private markSecure(): void {
    this.state = "secure";
    this.secureReadyResolve?.();
    this.secureReadyResolve = null;
    this.secureReadyReject = null;
  }

  private failSecure(error: Error): void {
    this.secureReadyReject?.(error);
    this.secureReadyResolve = null;
    this.secureReadyReject = null;
  }

  private computeHandshakeAuth(
    kind: string,
    role: string,
    pubkey: string,
    nonce?: Uint8Array,
    boxed?: Uint8Array,
  ): string {
    const secret = encodeUtf8(this.options.sessionSecret ?? this.options.password ?? "");
    const parts = [kind, role, pubkey];
    if (nonce) parts.push(sodium.to_base64(nonce, sodium.base64_variants.URLSAFE_NO_PADDING));
    if (boxed) parts.push(sodium.to_base64(boxed, sodium.base64_variants.URLSAFE_NO_PADDING));
    const message = encodeUtf8(parts.join(":"));
    const mac = sodium.crypto_auth(message, secret.length === 32 ? secret : sodium.crypto_generichash(32, secret)) as Uint8Array;
    return sodium.to_base64(mac, sodium.base64_variants.URLSAFE_NO_PADDING);
  }
}
