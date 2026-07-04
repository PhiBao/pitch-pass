'use client'

import { ArrowLeft, Coins, Swords } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { Tournament, Match } from '@/types/tournament'

function roundLabel(m: Match): string {
  if (m.round === 'r16') return 'R16'
  if (m.round === 'quarter') return 'QF'
  if (m.round === 'semi') return 'SF'
  return 'Final'
}

export default function CreatePotPage() {
  const router = useRouter()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [entryFee, setEntryFee] = useState('5')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/tournament')
      const data = await res.json()
      setTournaments(data.tournaments || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!selectedTournament || !selectedMatch) return
    setCreating(true)
    try {
      const res = await fetch('/api/pot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          tournamentId: selectedTournament.id,
          matchId: selectedMatch.id,
          entryFee: parseInt(entryFee) || 5,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast.success('Pot created')
      router.push(`/pot/${data.pot.id}`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCreating(false)
    }
  }

  const pendingMatches = selectedTournament?.matches.filter(
    (m) => m.status === 'pending' && m.teamA && m.teamB
  ) || []

  return (
    <main className="pb-6">
      <header className="sticky top-0 z-40 bg-pitch-bg/95 backdrop-blur border-b hairline">
        <div className="px-4 py-2.5 flex items-center gap-3">
          <Link href="/" className="p-1.5 -ml-1.5 rounded-lg hover:bg-pitch-surface/60">
            <ArrowLeft className="w-5 h-5 text-pitch-text" />
          </Link>
          <h1 className="text-base font-semibold text-pitch-text">Create Prediction Pot</h1>
        </div>
      </header>

      <div className="px-5 pt-4 space-y-5">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-pitch-accent/10 flex items-center justify-center">
            <Coins className="w-7 h-7 text-pitch-accent" />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-14 rounded-xl bg-pitch-surface animate-pulse" />)}
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-pitch-text-secondary">No active tournaments</p>
            <Link href="/tournament/create" className="text-sm text-pitch-primary mt-2 inline-block">
              Create a tournament first
            </Link>
          </div>
        ) : (
          <>
            <div>
              <label className="text-[10px] font-semibold text-pitch-text-secondary uppercase tracking-wide block mb-2">Tournament</label>
              <div className="space-y-1.5">
                {tournaments.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedTournament(t); setSelectedMatch(null) }}
                    className={`w-full text-left p-3 rounded-xl border transition-colors ${
                      selectedTournament?.id === t.id
                        ? 'bg-pitch-elevated border-pitch-primary/40'
                        : 'bg-pitch-surface hairline'
                    }`}
                  >
                    <p className="text-sm font-semibold text-pitch-text">{t.name}</p>
                    <p className="text-[10px] text-pitch-text-tertiary mt-0.5">{t.teams.length}/{t.teamSize} teams</p>
                  </button>
                ))}
              </div>
            </div>

            {selectedTournament && pendingMatches.length > 0 && (
              <div>
                <label className="text-[10px] font-semibold text-pitch-text-secondary uppercase tracking-wide block mb-2">Match</label>
                <div className="space-y-1.5">
                  {pendingMatches.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMatch(m)}
                      className={`w-full text-left p-3 rounded-xl border transition-colors ${
                        selectedMatch?.id === m.id
                          ? 'bg-pitch-elevated border-pitch-primary/40'
                          : 'bg-pitch-surface hairline'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Swords className="w-3.5 h-3.5 text-pitch-text-tertiary" />
                        <span className="text-sm font-medium text-pitch-text">
                          {m.teamA} vs {m.teamB}
                        </span>
                        <span className="text-[10px] text-pitch-text-tertiary ml-auto">{roundLabel(m)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedTournament && pendingMatches.length === 0 && (
              <p className="text-sm text-pitch-text-secondary text-center py-4">
                No pending matches in this tournament
              </p>
            )}

            <div>
              <label className="text-[10px] font-semibold text-pitch-text-secondary uppercase tracking-wide block mb-2">Entry Fee (USDt)</label>
              <input
                type="number"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-pitch-surface border hairline text-sm text-pitch-text tnum focus:outline-none focus:border-pitch-primary/40"
              />
            </div>

            <div className="p-4 rounded-xl bg-pitch-surface border hairline">
              <p className="text-[10px] font-semibold text-pitch-text-secondary uppercase tracking-wide mb-1.5">How it works</p>
              <p className="text-xs text-pitch-text-secondary leading-relaxed">
                Players predict match outcomes by staking USDt. Winners split the pot proportionally.
                No house edge. All stakes held transparently.
              </p>
            </div>

            <button
              onClick={handleCreate}
              disabled={creating || !selectedMatch}
              className="w-full py-3.5 rounded-xl bg-pitch-accent text-black font-semibold text-sm disabled:opacity-30 transition-opacity"
            >
              {creating ? 'Creating...' : `Create Pot (${parseInt(entryFee) || 0} USDt entry)`}
            </button>
          </>
        )}
      </div>
    </main>
  )
}
