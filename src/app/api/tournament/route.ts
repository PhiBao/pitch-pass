import { NextResponse } from 'next/server'
import {
  createTournament, getTournament, listTournaments, addTeam, updateResult, settleTournament,
  createPot, enterPot, settlePot, getPot, listPots, generateSeed, createInviteLink,
  seedWorldCup, worldCupExists, getPeerInfo,
} from '@/services/tournament'

export async function POST(request: Request) {
  const { action, ...data } = await request.json()
  try {
    switch (action) {
      case 'create': {
        const t = await createTournament(data)
        return NextResponse.json({ tournament: t, inviteLink: createInviteLink(t.discoveryKey, t.id) })
      }
      case 'join': {
        const t = await addTeam(data.tournamentId, data.team)
        return NextResponse.json({ tournament: t })
      }
      case 'result': {
        const t = await updateResult(data.tournamentId, data.matchId, data.scoreA, data.scoreB)
        return NextResponse.json({ tournament: t })
      }
      case 'settle': {
        const result = await settleTournament(data.tournamentId)
        return NextResponse.json(result)
      }
      case 'seed':
        return NextResponse.json({ seed: generateSeed() })
      case 'seed-worldcup': {
        const t = seedWorldCup()
        const peer = getPeerInfo()
        return NextResponse.json({ tournament: t, inviteLink: createInviteLink(t.discoveryKey, t.id), peer })
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
    const t = getTournament(id)
    if (!t) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ tournament: t, peer: getPeerInfo() })
  }
  if (!worldCupExists()) seedWorldCup()
  const peer = getPeerInfo()
  return NextResponse.json({ tournaments: listTournaments(), peer })
}
