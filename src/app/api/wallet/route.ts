import { NextResponse } from 'next/server'
import { createWallet, importWallet, getUsdtBalance, sendUsdt, generateSeedPhrase } from '@/services/wallet-service'

export async function POST(request: Request) {
  const { action, seed, address, to, amount } = await request.json()
  try {
    if (action === 'create') {
      const wallet = await createWallet()
      return NextResponse.json({ wallet })
    }
    if (action === 'import' && seed) {
      const wallet = await importWallet(seed)
      return NextResponse.json({ wallet })
    }
    if (action === 'seed') {
      return NextResponse.json({ seed: generateSeedPhrase() })
    }
    if (action === 'balance' && address) {
      const balance = await getUsdtBalance(address)
      return NextResponse.json({ balance })
    }
    if (action === 'send' && seed && to && amount) {
      const w = await importWallet(seed)
      const result = await sendUsdt(seed, w.address, to, amount)
      return NextResponse.json({ txHash: result.txHash })
    }
    return NextResponse.json({ error: 'unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
