'use client'

import { ArrowLeft, Coins, Check, X } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { PredictionPot, PotEntry, Tournament, Match } from '@/types/tournament'

export default function PotPage() {
  const { id } = useParams<{ id: string }>()
  const [pot, setPot] = useState<PredictionPot | null>(null)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [entering, setEntering] = useState(false)
  const [settling, setSettling] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)

  const load = useCallback(async () => {
    const [pRes] = await Promise.all([fetch(`/api/pot?id=${id}`)])
    const pData = await pRes.json()
    setPot(pData.pot || null)
    if (pData.pot) {
      const [tRes] = await Promise.all([fetch(`/api/tournament?id=${pData.pot.tournamentId}`)])
      const tData = await tRes.json()
      setTournament(tData.tournament || null)
      const found = tData.tournament?.matches.find((m: Match) => m.id === pData.pot.matchId)
      setMatch(found || null)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  const handleEnter = async (pick: 'teamA' | 'teamB' | 'draw') => {
    if (!pot) return
    setEntering(true)
    try {
      const entry: PotEntry = {
        address: '0x' + Math.random().toString(16).slice(2, 10).padStart(12, '0'),
        pick, stake: pot.entryFee, settled: false, won: null,
      }
      const res = await fetch('/api/pot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enter', potId: id, entry }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPot(data.pot)
      toast.success(`Picked ${pick === 'draw' ? 'Draw' : pick === 'teamA' ? match?.teamA : match?.teamB}`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setEntering(false)
    }
  }

  const handleSettle = async (winner: 'teamA' | 'teamB' | 'draw') => {
    setSettling(true)
    try {
      const res = await fetch('/api/pot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'settle', potId: id, winner }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPot(data.pot)
      if (data.payouts?.length > 0) {
        toast.success(`${data.payouts.length} winner(s) · ${data.payouts[0]?.amount} USDt each`)
      } else {
        toast.success('Pot settled, no winners')
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSettling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50dvh]">
        <div className="w-6 h-6 border-2 border-pitch-primary/30 border-t-pitch-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!pot) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50dvh] gap-3">
        <p className="text-pitch-text-secondary">Pot not found</p>
        <Link href="/" className="text-sm text-pitch-primary">Home</Link>
      </div>
    )
  }

  const potWinners = pot.entries.filter((e) => e.won)
  const perWinner = potWinners.length > 0 ? Math.floor(pot.totalPool / potWinners.length) : 0

  return (
    <main className="pb-6">
      <header className="sticky top-0 z-40 bg-pitch-bg/95 backdrop-blur border-b hairline">
        <div className="px-4 py-2.5 flex items-center gap-3">
          <Link href="/" className="p-1.5 -ml-1.5 rounded-lg hover:bg-pitch-surface/60">
            <ArrowLeft className="w-5 h-5 text-pitch-text" />
          </Link>
          <h1 className="text-sm font-semibold text-pitch-text">Pot</h1>
          {tournament && (
            <Link href={`/tournament/${tournament.id}`} className="ml-auto text-[10px] text-pitch-text-secondary hover:text-pitch-text">
              {tournament.name} &rarr;
            </Link>
          )}
        </div>
      </header>

      <div className="px-5 pt-4 space-y-4">
        {match && (
          <div className="rounded-xl bg-pitch-surface border hairline p-4">
            <p className="text-[10px] font-semibold text-pitch-text-secondary uppercase tracking-wide mb-2">Match</p>
            <p className="text-base font-semibold text-pitch-text">
              {match.teamA}
              <span className="text-pitch-text-tertiary mx-2">vs</span>
              {match.teamB}
            </p>
            <p className="text-[10px] text-pitch-text-tertiary mt-1">
              {match.round === 'r16' ? 'Round of 16' : match.round === 'quarter' ? 'Quarter-Final' : match.round === 'semi' ? 'Semi-Final' : 'Final'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-pitch-surface border hairline p-3 text-center">
            <p className="text-lg font-bold text-pitch-accent tnum">{pot.totalPool}</p>
            <p className="text-[10px] text-pitch-text-secondary mt-0.5">USDt Pool</p>
          </div>
          <div className="rounded-xl bg-pitch-surface border hairline p-3 text-center">
            <p className="text-lg font-bold text-pitch-text tnum">{pot.entries.length}</p>
            <p className="text-[10px] text-pitch-text-secondary mt-0.5">Entries</p>
          </div>
          <div className="rounded-xl bg-pitch-surface border hairline p-3 text-center">
            <p className="text-lg font-bold text-pitch-primary tnum">{pot.entryFee}</p>
            <p className="text-[10px] text-pitch-text-secondary mt-0.5">USDt Entry</p>
          </div>
        </div>

        {pot.status === 'settled' && potWinners.length > 0 && (
          <div className="rounded-xl bg-pitch-success/10 border border-pitch-success/20 p-4 text-center">
            <Check className="w-6 h-6 text-pitch-success mx-auto mb-1" />
            <p className="text-sm font-semibold text-pitch-success">{potWinners.length} winner{potWinners.length > 1 ? 's' : ''}</p>
            <p className="text-xs text-pitch-text-secondary mt-0.5">{perWinner} USDt each</p>
          </div>
        )}

        {pot.status === 'open' && match && (
          <div>
            <p className="text-[10px] font-semibold text-pitch-text-secondary uppercase tracking-wide mb-2">Make your pick</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleEnter('teamA')}
                disabled={entering}
                className="py-3 rounded-xl border transition-colors disabled:opacity-50 bg-pitch-surface border-pitch-primary/30"
              >
                <p className="text-[11px] font-semibold text-pitch-primary truncate px-1">{match.teamA}</p>
              </button>
              <button
                onClick={() => handleEnter('draw')}
                disabled={entering}
                className="py-3 rounded-xl border hairline transition-colors disabled:opacity-50 bg-pitch-surface"
              >
                <p className="text-[11px] font-semibold text-pitch-text">Draw</p>
              </button>
              <button
                onClick={() => handleEnter('teamB')}
                disabled={entering}
                className="py-3 rounded-xl border transition-colors disabled:opacity-50 bg-pitch-surface border-pitch-primary/30"
              >
                <p className="text-[11px] font-semibold text-pitch-primary truncate px-1">{match.teamB}</p>
              </button>
            </div>
          </div>
        )}

        {pot.entries.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-pitch-text-secondary uppercase tracking-wide mb-2">
              Predictions ({pot.entries.length})
            </p>
            <div className="space-y-1">
              {pot.entries.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-pitch-surface border hairline">
                  <div>
                    <p className="text-[10px] text-pitch-text-tertiary font-mono">{entry.address}</p>
                    <p className="text-[11px] text-pitch-text-secondary mt-0.5">
                      <span className="text-pitch-accent font-semibold">
                        {entry.pick === 'draw' ? 'Draw' : entry.pick === 'teamA' ? match?.teamA : match?.teamB}
                      </span>
                    </p>
                  </div>
                  {entry.settled && (
                    entry.won
                      ? <Check className="w-4 h-4 text-pitch-success shrink-0" />
                      : <X className="w-4 h-4 text-pitch-danger shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {pot.status === 'open' && pot.entries.length > 0 && match && (
          <div className="pt-4 border-t hairline">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-pitch-text-secondary uppercase tracking-wide">Settle (Admin)</p>
              <button
                onClick={() => setShowAdmin(!showAdmin)}
                className="text-[10px] text-pitch-text-tertiary hover:text-pitch-text"
              >
                {showAdmin ? 'Hide' : 'Show'}
              </button>
            </div>

            {showAdmin && (
              <div className="space-y-1.5">
                <button
                  onClick={() => handleSettle('teamA')}
                  disabled={settling}
                  className="w-full py-2.5 rounded-lg bg-pitch-primary/10 text-pitch-primary text-xs font-semibold hover:bg-pitch-primary/20 transition-colors disabled:opacity-50"
                >
                  {match.teamA} wins
                </button>
                <button
                  onClick={() => handleSettle('draw')}
                  disabled={settling}
                  className="w-full py-2.5 rounded-lg bg-pitch-surface border hairline text-xs font-semibold text-pitch-text-secondary disabled:opacity-50"
                >
                  Draw
                </button>
                <button
                  onClick={() => handleSettle('teamB')}
                  disabled={settling}
                  className="w-full py-2.5 rounded-lg bg-pitch-primary/10 text-pitch-primary text-xs font-semibold hover:bg-pitch-primary/20 transition-colors disabled:opacity-50"
                >
                  {match.teamB} wins
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
