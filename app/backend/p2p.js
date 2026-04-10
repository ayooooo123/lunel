/**
 * Bare worklet — runs inside the Bare runtime (native thread).
 *
 * Has real native UDP via HyperDHT (unlike the RN JS runtime which can't bind
 * raw UDP). Spawned by react-native-bare-kit; communicates with the RN side
 * over IPC (a streamx Duplex exposed as `BareKit.IPC`).
 *
 * Protocol:
 *   RN → Worklet: newline-delimited JSON { cmd: 'connect', key: '<z32 key>' }
 *   Worklet → RN: newline-delimited JSON { status: 'connected' | 'error' | 'closed', reason? }
 *   After connected: raw binary framed stream data in both directions (pass-through)
 *
 * BareKit and Bare are globals injected by the runtime — do not require() them.
 */

const HolesailClient = require('holesail-client')

const { IPC } = BareKit // eslint-disable-line no-undef

let lineBuf = ''

function onIPCData (chunk) {
  lineBuf += chunk.toString()
  let nl
  while ((nl = lineBuf.indexOf('\n')) !== -1) {
    const line = lineBuf.slice(0, nl)
    lineBuf = lineBuf.slice(nl + 1)
    let msg
    try { msg = JSON.parse(line) } catch { continue }
    if (msg.cmd === 'connect') {
      IPC.off('data', onIPCData) // stop parsing commands; switch to passthrough
      connectToServer(msg.key)
      return
    }
  }
}

IPC.on('data', onIPCData)

async function connectToServer (z32Key) {
  try {
    const client = new HolesailClient({ key: z32Key })

    await new Promise((resolve, reject) => {
      // Override handleTCP to intercept the raw noise duplex stream from HyperDHT
      // instead of proxying it to a local TCP port (which is the default behaviour).
      client.handleTCP = (conn) => {
        // Notify RN that the HyperDHT stream is open
        IPC.write(JSON.stringify({ status: 'connected' }) + '\n')

        // Forward raw stream data from HyperDHT → RN
        conn.on('data', (chunk) => IPC.write(chunk))

        conn.on('close', () => {
          try { IPC.write(JSON.stringify({ status: 'closed' }) + '\n') } catch {}
          Bare.exit(0) // eslint-disable-line no-undef
        })

        conn.on('error', (err) => {
          try { IPC.write(JSON.stringify({ status: 'error', reason: err.message }) + '\n') } catch {}
        })

        // Forward raw stream data from RN → HyperDHT
        IPC.on('data', (chunk) => conn.write(chunk))

        resolve()
      }

      // Start the HyperDHT connection (uses real native UDP)
      client.connect({}).catch(reject)
    })
  } catch (err) {
    IPC.write(JSON.stringify({ status: 'error', reason: String(err) }) + '\n')
    Bare.exit(1) // eslint-disable-line no-undef
  }
}
