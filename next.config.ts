import type { NextConfig } from 'next'

const config: NextConfig = {
  serverExternalPackages: ['hypercore', '@hyperswarm/dht', 'autobase', 'corestore', 'hyperbee', 'sodium-javascript', 'b4a'],
}

export default config
