import { NextResponse } from 'next/server'
import {
  createTournament, getTournament, listTournaments, addTeam, updateResult, settleTournament,
  createPot, enterPot, settlePot, getPot, listPots, generateSeed, createInviteLink,
  seedWorldCup, worldCupExists, getActiveHypercoreInfo,
} from '@/services/tournament'

export async function POST(request: Request) {
  const { action, ...data } = await request.json()
  try {
    switch (action) {
      case 'create': {
        const t = createTournament(data)
        return NextResponse.json({ tournament: t, inviteLink: createInviteLink(t.discoveryKey, t.id) })
      }
      case 'join': {
        const t = addTeam(data.tournamentId, data.team)
        return NextResponse.json({ tournament: t })
      }
      case 'result': {
        const t = updateResult(data.tournamentId, data.matchId, data.scoreA, data.scoreB)
        return NextResponse.json({ tournament: t })
      }
      case 'settle': {
        const result = settleTournament(data.tournamentId)
        return NextResponse.json(result)
      }
      case 'seed':
        return NextResponse.json({ seed: generateSeed() })
      case 'seed-worldcup': {
        const t = seedWorldCup()
        const core = getActiveHypercoreInfo()
        return NextResponse.json({ tournament: t, inviteLink: createInviteLink(t.discoveryKey, t.id), hypercore: core })
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
    return NextResponse.json({ tournament: t })
  }
  if (!worldCupExists()) seedWorldCup()
  const core = getActiveHypercoreInfo()
  return NextResponse.json({ tournaments: listTournaments(), hypercore: core })
}
