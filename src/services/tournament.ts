import type { Tournament, Team, Match, PredictionPot, PotEntry, Payout, WalletState } from '@/types/tournament'

const tournaments = new Map<string, Tournament>()
const pots = new Map<string, PredictionPot>()
const wallets = new Map<string, WalletState>()
let activeHypercore: { key: string; events: unknown[] } | null = null

function generateKeyPair(): { publicKey: string; secretKey: string } {
  const sodium = require('sodium-javascript')
  const pk = Buffer.alloc(32)
  const sk = Buffer.alloc(64)
  sodium.crypto_sign_keypair(pk, sk)
  return { publicKey: pk.toString('hex'), secretKey: sk.toString('hex') }
}

function createHypercore(): { key: string; append: (e: unknown) => void } {
  const key = generateKeyPair().publicKey
  activeHypercore = { key, events: [] }
  return {
    key,
    append(e: unknown) {
      activeHypercore?.events.push({ ...(e as object), timestamp: Date.now(), seq: activeHypercore.events.length })
    },
  }
}

export function createInviteLink(publicKey: string, tournamentId: string): string {
  return `pear://pitchpass/tournament/${tournamentId}?key=${publicKey}`
}

function generateBracket(tournamentId: string, teamSize: number): Match[] {
  const matches: Match[] = []
  const slots = Math.pow(2, Math.ceil(Math.log2(teamSize)))

  const is16 = teamSize >= 16
  if (is16) {
    for (let i = 0; i < slots / 2; i++) {
      matches.push({
        id: `r16-${tournamentId}-${i}`, round: 'r16', teamA: '', teamB: '',
        scoreA: null, scoreB: null, winner: null, status: 'pending',
      })
    }
  }
  if (is16 || teamSize > 4) {
    for (let i = 0; i < slots / 4; i++) {
      matches.push({
        id: `qf-${tournamentId}-${i}`, round: 'quarter', teamA: '', teamB: '',
        scoreA: null, scoreB: null, winner: null, status: 'pending',
      })
    }
  }
  if (teamSize > 2) {
    const semiCount = Math.max(2, slots / 4)
    for (let i = 0; i < semiCount; i++) {
      matches.push({
        id: `semi-${tournamentId}-${i}`, round: 'semi', teamA: '', teamB: '',
        scoreA: null, scoreB: null, winner: null, status: 'pending',
      })
    }
  }
  matches.push({
    id: `final-${tournamentId}`, round: 'final', teamA: '', teamB: '',
    scoreA: null, scoreB: null, winner: null, status: 'pending',
  })
  return matches
}

export function createTournament(params: {
  name: string; teamSize: number; entryFee: number; creatorAddress: string
}): Tournament {
  const keyPair = generateKeyPair()
  const core = createHypercore()
  const id = keyPair.publicKey.slice(0, 16)

  const t: Tournament = {
    id,
    name: params.name,
    format: 'knockout',
    teamSize: params.teamSize,
    entryFee: params.entryFee,
    prizeSplit: { first: 0.5, second: 0.3, third: 0.2 },
    status: 'registration',
    teams: [],
    matches: generateBracket(id, params.teamSize),
    totalPrizePool: 0,
    createdAt: Date.now(),
    createdBy: params.creatorAddress,
    discoveryKey: core.key,
    hypercoreLength: 0,
  }

  core.append({ type: 'created', tournament: { id, name: params.name } })
  t.hypercoreLength = activeHypercore?.events.length || 1
  tournaments.set(id, t)
  return t
}

export function getTournament(id: string): Tournament | null {
  return tournaments.get(id) || null
}

export function listTournaments(): Tournament[] {
  return Array.from(tournaments.values()).sort((a, b) => b.createdAt - a.createdAt)
}

export function addTeam(tournamentId: string, team: Team): Tournament {
  const t = tournaments.get(tournamentId)
  if (!t) throw new Error('Tournament not found')
  if (t.status !== 'registration') throw new Error('Registration closed')
  if (t.teams.length >= t.teamSize) throw new Error('Tournament full')

  t.teams.push(team)
  t.totalPrizePool = t.teams.length * t.entryFee

  if (t.teams.length >= t.teamSize) {
    t.status = 'active'
    seedBracket(t)
  }
  return t
}

function seedBracket(t: Tournament): void {
  const teams = [...t.teams].sort(() => Math.random() - 0.5)
  const r16 = t.matches.filter((m) => m.round === 'r16')
  const qf = t.matches.filter((m) => m.round === 'quarter')
  const semi = t.matches.filter((m) => m.round === 'semi')
  const finalMatch = t.matches.find((m) => m.round === 'final')

  if (r16.length > 0) {
    r16.forEach((m, i) => { m.teamA = teams[i * 2]?.name || ''; m.teamB = teams[i * 2 + 1]?.name || '' })
  } else if (qf.length > 0) {
    qf.forEach((m, i) => { m.teamA = teams[i * 2]?.name || ''; m.teamB = teams[i * 2 + 1]?.name || '' })
  } else if (semi.length > 0) {
    semi.forEach((m, i) => { m.teamA = teams[i * 2]?.name || ''; m.teamB = teams[i * 2 + 1]?.name || '' })
  } else if (finalMatch) {
    finalMatch.teamA = teams[0]?.name || ''
    finalMatch.teamB = teams[1]?.name || ''
  }
}

export function updateResult(
  tournamentId: string, matchId: string, scoreA: number, scoreB: number
): Tournament {
  const t = tournaments.get(tournamentId)
  if (!t) throw new Error('Tournament not found')
  const match = t.matches.find((m) => m.id === matchId)
  if (!match) throw new Error('Match not found')

  match.scoreA = scoreA
  match.scoreB = scoreB
  match.winner = scoreA > scoreB ? match.teamA : match.teamB
  if (scoreA === scoreB) match.winner = match.teamA
  match.status = 'completed'
  advanceBracket(t)
  return t
}

function advanceBracket(t: Tournament): void {
  const rounds = ['r16', 'quarter', 'semi', 'final'] as const
  for (let ri = 0; ri < rounds.length - 1; ri++) {
    const currentMatches = t.matches.filter((m) => m.round === rounds[ri])
    if (currentMatches.length === 0) continue
    if (!currentMatches.every((m) => m.status === 'completed')) continue

    const nextMatches = t.matches.filter((m) => m.round === rounds[ri + 1] && m.status === 'pending')
    if (nextMatches.length === 0) continue

    for (let i = 0; i < nextMatches.length; i++) {
      const wa = currentMatches[i * 2]?.winner
      const wb = currentMatches[i * 2 + 1]?.winner
      if (!nextMatches[i].teamA && wa) nextMatches[i].teamA = wa
      if (!nextMatches[i].teamB && wb) nextMatches[i].teamB = wb
    }
  }
}

function calculatePayouts(t: Tournament): Payout[] {
  const { first, second, third } = t.prizeSplit
  const pool = t.totalPrizePool
  const completed = [...t.matches].filter((m) => m.status === 'completed').reverse()
  const champion = completed[0]?.winner
  const runnerUp = completed.length >= 2
    ? (completed[1].teamA === champion ? completed[1].teamB : completed[1].teamA)
    : null

  const payouts: Payout[] = []
  if (champion && !payouts.find((p) => p.teamName === champion)) {
    payouts.push({ teamName: champion, amount: pool * first, place: 1 })
  }
  if (runnerUp && !payouts.find((p) => p.teamName === runnerUp)) {
    payouts.push({ teamName: runnerUp, amount: pool * second, place: 2 })
  }
  const semiMatches = t.matches.filter((m) => m.round === 'semi')
  for (const sm of semiMatches) {
    const thirdTeam = sm.winner === sm.teamA ? sm.teamB : sm.teamA
    if (thirdTeam && thirdTeam !== champion && thirdTeam !== runnerUp && !payouts.find((p) => p.teamName === thirdTeam)) {
      payouts.push({ teamName: thirdTeam, amount: pool * third, place: 3 })
    }
  }
  return payouts
}

export function settleTournament(tournamentId: string): { tournament: Tournament; payouts: Payout[] } {
  const t = tournaments.get(tournamentId)
  if (!t) throw new Error('Tournament not found')
  t.status = 'completed'
  return { tournament: t, payouts: calculatePayouts(t) }
}

export function createPot(params: { tournamentId: string; matchId: string; entryFee: number }): PredictionPot {
  const pot: PredictionPot = {
    id: 'pot-' + Date.now().toString(36),
    tournamentId: params.tournamentId,
    matchId: params.matchId,
    entryFee: params.entryFee,
    entries: [],
    status: 'open',
    totalPool: 0,
    createdAt: Date.now(),
    settledAt: null,
    discoveryKey: '',
  }
  pots.set(pot.id, pot)
  return pot
}

export function enterPot(potId: string, entry: PotEntry): PredictionPot {
  const pot = pots.get(potId)
  if (!pot) throw new Error('Pot not found')
  if (pot.status !== 'open') throw new Error('Pot closed')
  pot.entries.push(entry)
  pot.totalPool = pot.entries.length * pot.entryFee
  return pot
}

export function settlePot(
  potId: string, winner: 'teamA' | 'teamB' | 'draw'
): { pot: PredictionPot; payouts: { address: string; amount: number }[] } {
  const pot = pots.get(potId)
  if (!pot) throw new Error('Pot not found')
  pot.entries.forEach((e) => { e.settled = true; e.won = e.pick === winner })
  pot.status = 'settled'
  pot.settledAt = Date.now()
  const winners = pot.entries.filter((e) => e.won)
  const perWinner = winners.length > 0 ? Math.floor(pot.totalPool / winners.length) : 0
  return { pot, payouts: winners.map((e) => ({ address: e.address, amount: perWinner })) }
}

export function getPot(potId: string): PredictionPot | null {
  return pots.get(potId) || null
}

export function listPots(): PredictionPot[] {
  return Array.from(pots.values()).sort((a, b) => b.createdAt - a.createdAt)
}

export function generateSeed(): string {
  const bip39 = require('bip39')
  return bip39.generateMnemonic()
}

export function deriveAddress(_seed: string): string {
  const sodium = require('sodium-javascript')
  const pk = Buffer.alloc(32)
  const sk = Buffer.alloc(64)
  sodium.crypto_sign_keypair(pk, sk)
  return '0x' + pk.toString('hex').slice(0, 40)
}

export function createWallet(): WalletState {
  const seed = generateSeed()
  const address = deriveAddress(seed)
  const w: WalletState = { seed, address, balance: 100, createdAt: Date.now() }
  wallets.set(address, w)
  return w
}

export function importWallet(seed: string): WalletState {
  const address = deriveAddress(seed)
  const w: WalletState = { seed, address, balance: 100, createdAt: Date.now() }
  wallets.set(address, w)
  return w
}

export function getWallet(address: string): WalletState | null {
  return wallets.get(address) || null
}

const WC_ID = 'wc2026r16'

export function worldCupExists(): boolean {
  return tournaments.has(WC_ID)
}

export function seedWorldCup(): Tournament {
  if (tournaments.has(WC_ID)) return tournaments.get(WC_ID)!

  const keyPair = generateKeyPair()
  const core = createHypercore()

  const teamNames = [
    'Argentina', 'France', 'England', 'Spain',
    'Germany', 'Netherlands', 'Brazil', 'Belgium',
    'Mexico', 'Switzerland', 'USA', 'Colombia',
    'Portugal', 'Japan', 'Morocco', 'Croatia',
  ]

  const teams: Team[] = teamNames.map((name, i) => ({
    id: `wc-t${i}`,
    name,
    captainAddress: `0xwc${name.toLowerCase().slice(0, 4)}`,
    joinedAt: Date.now(),
  }))

  const matches: Match[] = [
    { id: 'r16-1', round: 'r16', teamA: 'Argentina', teamB: 'Japan', scoreA: 3, scoreB: 1, winner: 'Argentina', status: 'completed' },
    { id: 'r16-2', round: 'r16', teamA: 'France', teamB: 'Portugal', scoreA: 2, scoreB: 1, winner: 'France', status: 'completed' },
    { id: 'r16-3', round: 'r16', teamA: 'England', teamB: 'Croatia', scoreA: 2, scoreB: 0, winner: 'England', status: 'completed' },
    { id: 'r16-4', round: 'r16', teamA: 'Spain', teamB: 'Morocco', scoreA: 2, scoreB: 1, winner: 'Spain', status: 'completed' },
    { id: 'r16-5', round: 'r16', teamA: 'Germany', teamB: 'Switzerland', scoreA: 3, scoreB: 2, winner: 'Germany', status: 'completed', penalties: { a: 5, b: 3 } },
    { id: 'r16-6', round: 'r16', teamA: 'Netherlands', teamB: 'Mexico', scoreA: 2, scoreB: 0, winner: 'Netherlands', status: 'completed' },
    { id: 'r16-7', round: 'r16', teamA: 'Brazil', teamB: 'Colombia', scoreA: 1, scoreB: 1, winner: 'Brazil', status: 'completed', penalties: { a: 4, b: 2 } },
    { id: 'r16-8', round: 'r16', teamA: 'Belgium', teamB: 'USA', scoreA: 1, scoreB: 2, winner: 'USA', status: 'completed' },
    { id: 'qf-1', round: 'quarter', teamA: 'Argentina', teamB: 'France', scoreA: null, scoreB: null, winner: null, status: 'pending' },
    { id: 'qf-2', round: 'quarter', teamA: 'England', teamB: 'Spain', scoreA: null, scoreB: null, winner: null, status: 'pending' },
    { id: 'qf-3', round: 'quarter', teamA: 'Germany', teamB: 'Netherlands', scoreA: null, scoreB: null, winner: null, status: 'pending' },
    { id: 'qf-4', round: 'quarter', teamA: 'Brazil', teamB: 'USA', scoreA: null, scoreB: null, winner: null, status: 'pending' },
    { id: 'semi-1', round: 'semi', teamA: '', teamB: '', scoreA: null, scoreB: null, winner: null, status: 'pending' },
    { id: 'semi-2', round: 'semi', teamA: '', teamB: '', scoreA: null, scoreB: null, winner: null, status: 'pending' },
    { id: 'final-1', round: 'final', teamA: '', teamB: '', scoreA: null, scoreB: null, winner: null, status: 'pending' },
  ]

  core.append({ type: 'wc-seeded', teams: teamNames, timestamp: Date.now() })

  const t: Tournament = {
    id: WC_ID,
    name: 'World Cup 2026',
    format: 'knockout',
    teamSize: 16,
    entryFee: 10,
    prizeSplit: { first: 0.5, second: 0.3, third: 0.2 },
    status: 'active',
    teams,
    matches,
    totalPrizePool: 160,
    createdAt: Date.now(),
    createdBy: 'pitchpass',
    discoveryKey: core.key,
    hypercoreLength: activeHypercore?.events.length || 1,
  }

  tournaments.set(WC_ID, t)

  seedWorldCupPots(t)

  return t
}

function seedWorldCupPots(t: Tournament): void {
  const pendingMatches = t.matches.filter((m) => m.status === 'pending' && m.teamA && m.teamB)
  const topMatches = pendingMatches.slice(0, 2)
  topMatches.forEach((match) => {
    if (!match.teamA || !match.teamB) return
    const pot = createPot({ tournamentId: t.id, matchId: match.id, entryFee: 5 })
    enterPot(pot.id, { address: '0xf1B7...', pick: 'teamA', stake: 5, settled: false, won: null })
    enterPot(pot.id, { address: '0xa3D2...', pick: 'teamB', stake: 5, settled: false, won: null })
    enterPot(pot.id, { address: '0xc9E4...', pick: 'draw', stake: 5, settled: false, won: null })
  })
}

export function getActiveHypercoreInfo(): { key: string; length: number } | null {
  if (!activeHypercore) return null
  return { key: activeHypercore.key, length: activeHypercore.events.length }
}
