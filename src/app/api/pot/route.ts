import { NextResponse } from 'next/server'
import { createPot, enterPot, settlePot, getPot, listPots } from '@/services/tournament'

export async function POST(request: Request) {
  const { action, ...data } = await request.json()
  try {
    switch (action) {
      case 'create': {
        const pot = createPot(data)
        return NextResponse.json({ pot })
      }
      case 'enter': {
        const pot = enterPot(data.potId, data.entry)
        return NextResponse.json({ pot })
      }
      case 'settle': {
        const result = settlePot(data.potId, data.winner)
        return NextResponse.json(result)
      }
      default:
        return NextResponse.json({ error: 'unknown action' }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (id) {
    const pot = getPot(id)
    if (!pot) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ pot })
  }
  return NextResponse.json({ pots: listPots() })
}
