import { HDNodeWallet, JsonRpcProvider, Contract, formatUnits, parseUnits } from 'ethers'

const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'
const USDT_SEPOLIA = '0xd077a400968890eacc75cdc901f0356c943e4fdb'

const USDT_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function symbol() view returns (string)',
]

function getProvider(): JsonRpcProvider {
  return new JsonRpcProvider(SEPOLIA_RPC)
}

const wallets = new Map<string, HDNodeWallet>()

function loadWDK(): any {
  const wdk = require('@tetherto/wdk')
  return wdk.default || wdk
}

function loadBip39(): any {
  return require('bip39')
}

function getHdWallet(seed: string, index = 0): HDNodeWallet {
  return HDNodeWallet.fromPhrase(seed, undefined, `m/44'/60'/0'/0/${index}`)
}

function getOrCreateSigner(seed: string, address: string): HDNodeWallet {
  if (wallets.has(address)) return wallets.get(address)!
  const w = getHdWallet(seed).connect(getProvider())
  wallets.set(address, w)
  return w
}

export function generateSeedPhrase(): string {
  try {
    return loadWDK().getRandomSeedPhrase()
  } catch {
    return loadBip39().generateMnemonic()
  }
}

export async function createWallet(): Promise<{ seed: string; address: string; balance: number }> {
  const seed = generateSeedPhrase()
  const hdWallet = getHdWallet(seed)
  const address = hdWallet.address
  const balance = await getUsdtBalance(address)
  return { seed, address, balance }
}

export async function importWallet(seed: string): Promise<{ seed: string; address: string; balance: number }> {
  const hdWallet = getHdWallet(seed)
  const address = hdWallet.address
  const balance = await getUsdtBalance(address)
  return { seed, address, balance }
}

export async function getUsdtBalance(address: string): Promise<number> {
  const provider = getProvider()
  const contract = new Contract(USDT_SEPOLIA, USDT_ABI, provider) as any
  const [raw, decimals] = await Promise.all([
    contract.balanceOf(address),
    contract.decimals(),
  ]) as [bigint, number]
  return Number(formatUnits(raw, decimals))
}

export async function sendUsdt(
  seed: string,
  fromAddress: string,
  to: string,
  amount: number
): Promise<{ txHash: string }> {
  const provider = getProvider()
  const tempContract: any = new Contract(USDT_SEPOLIA, ['function decimals() view returns (uint8)'], provider)
  const decimals: number = await tempContract.decimals()

  const signer = getOrCreateSigner(seed, fromAddress)
  const usdtContract: any = new Contract(USDT_SEPOLIA, USDT_ABI, signer)
  const txResp = await usdtContract.transfer(to, parseUnits(amount.toString(), decimals))
  const receipt = await txResp.wait()
  return { txHash: receipt.hash }
}
