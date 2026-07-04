export interface Team {
  id: string
  name: string
  captainAddress: string
  joinedAt: number
}

export interface Match {
  id: string
  round: 'r16' | 'quarter' | 'semi' | 'final'
  teamA: string
  teamB: string
  scoreA: number | null
  scoreB: number | null
  winner: string | null
  status: 'pending' | 'completed'
  penalties?: { a: number; b: number }
}

export interface Tournament {
  id: string
  name: string
  format: 'knockout'
  teamSize: number
  entryFee: number
  prizeSplit: { first: number; second: number; third: number }
  status: 'registration' | 'active' | 'completed'
  teams: Team[]
  matches: Match[]
  totalPrizePool: number
  createdAt: number
  createdBy: string
  discoveryKey: string
  hypercoreLength: number
}

export interface PotEntry {
  address: string
  pick: 'teamA' | 'teamB' | 'draw'
  stake: number
  settled: boolean
  won: boolean | null
}

export interface PredictionPot {
  id: string
  tournamentId: string
  matchId: string
  entryFee: number
  entries: PotEntry[]
  status: 'open' | 'locked' | 'settled'
  totalPool: number
  createdAt: number
  settledAt: number | null
  discoveryKey: string
}

export interface Payout {
  teamName: string
  amount: number
  place: number
}

export interface WalletState {
  seed: string
  address: string
  balance: number
  createdAt: number
}
