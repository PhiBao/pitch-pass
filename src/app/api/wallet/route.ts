import { NextResponse } from 'next/server'
import { createWallet, importWallet, getWallet } from '@/services/tournament'

export async function POST(request: Request) {
  const { action, seed } = await request.json()
  try {
    if (action === 'create') {
      const wallet = createWallet()
      return NextResponse.json({ wallet })
    }
    if (action === 'import' && seed) {
      const wallet = importWallet(seed)
      return NextResponse.json({ wallet })
    }
    if (action === 'get' && seed) {
      const wallet = getWallet(seed)
      if (!wallet) return NextResponse.json({ error: 'not found' }, { status: 404 })
      return NextResponse.json({ wallet })
    }
    return NextResponse.json({ error: 'unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
