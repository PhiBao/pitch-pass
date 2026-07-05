import path from 'path'
import fs from 'fs'

let _store: any = null
let _dht: any = null
let _server: any = null
let _initialized = false
const _cores: Map<string, any> = new Map()
const _peerCounts: Map<string, number> = new Map()

const STORE_DIR = path.join(process.cwd(), '.pitchpass-p2p-storage')

function ensureStoreDir() {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true })
  }
}

function getStore(): any {
  if (!_store) {
    ensureStoreDir()
    const Corestore = require('corestore')
    _store = new Corestore(STORE_DIR)
  }
  return _store
}

function getDHT(): any {
  if (!_dht) {
    const DHT = require('@hyperswarm/dht')
    _dht = new DHT()
  }
  return _dht
}

export function getOrCreateCore(name: string): any {
  if (_cores.has(name)) return _cores.get(name)
  const store = getStore()
  const core = store.get({ name, valueEncoding: 'json' })
  _cores.set(name, core)
  return core
}

export async function openCore(name: string): Promise<{ core: any; events: unknown[] }> {
  const core = getOrCreateCore(name)
  await core.ready()

  const events: unknown[] = []
  for (let i = 0; i < core.length; i++) {
    const block = await core.get(i)
    events.push(block)
  }

  return { core, events }
}

export async function appendToCore(coreName: string, entry: unknown): Promise<void> {
  const core = getOrCreateCore(coreName)
  await core.ready()
  await core.append(entry)
}

export async function startReplication(discoveryKey: Buffer): Promise<string> {
  const dht = getDHT()

  if (!_server) {
    _server = dht.createServer()
    _server.on('connection', (socket: any) => {
      for (const [, c] of _cores) {
        try {
          c.replicate(socket)
        } catch {}
      }
    })
    await _server.listen()
  }

  try {
    await dht.announce(discoveryKey, _server.address())
    _initialized = true
  } catch {}

  return discoveryKey.toString('hex')
}

export function getPeerCount(): number {
  if (!_server) return 0
  try {
    return _server.connections?.size || 0
  } catch {
    return 0
  }
}

export function isReplicationActive(): boolean {
  return _initialized
}

export function getServerPublicKey(): string | null {
  if (!_server) return null
  try {
    return _server.address?.().publicKey?.toString('hex') || null
  } catch {
    return null
  }
}
