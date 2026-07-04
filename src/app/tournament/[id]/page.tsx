'use client'

import { Trophy, ArrowLeft, Swords, Users, Check, Crown, Share2, Plus, Coins, Zap } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { Tournament, Match, Payout } from '@/types/tournament'

function roundLabel(m: Match): string {
  if (m.round === 'r16') return 'Round of 16'
  if (m.round === 'quarter') return 'Quarter-Final'
  if (m.round === 'semi') return 'Semi-Final'
  return 'Final'
}

function roundOrder(r: Match['round']): number {
  return { r16: 0, quarter: 1, semi: 2, final: 3 }[r]
}

export default function TournamentPage() {
  const { id } = useParams<{ id: string }>()
  const [t, setT] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'bracket' | 'teams' | 'results'>('bracket')
  const [editingMatch, setEditingMatch] = useState<string | null>(null)
  const [scoreA, setScoreA] = useState('')
  const [scoreB, setScoreB] = useState('')
  const [joining, setJoining] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/tournament?id=${id}`)
    const data = await res.json()
    setT(data.tournament || null)
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  const handleJoin = async () => {
    setJoining(true)
    try {
      const res = await fetch('/api/tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join', tournamentId: id,
          team: { id: 'team-' + Date.now(), name: `Team ${(t?.teams.length ?? 0) + 1}`, captainAddress: '0x0', joinedAt: Date.now() },
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setT(data.tournament)
      toast.success('Team joined')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setJoining(false)
    }
  }

  const handleSubmit = async () => {
    if (!editingMatch) return
    const a = parseInt(scoreA) || 0
    const b = parseInt(scoreB) || 0
    setSubmitting(true)
    try {
      const res = await fetch('/api/tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'result', tournamentId: id, matchId: editingMatch, scoreA: a, scoreB: b }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setT(data.tournament)
      setEditingMatch(null)
      setScoreA('')
      setScoreB('')
      toast.success('Result saved')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSettle = async () => {
    try {
      const res = await fetch('/api/tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'settle', tournamentId: id }),
      })
      const data = await res.json()
      setT(data.tournament)
      const msg = (data.payouts || [])
        .slice(0, 3)
        .map((p: Payout) => `${p.place}st: ${p.teamName} · ${p.amount} USDt`)
        .join(' | ')
      toast.success('Tournament settled', { description: msg })
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleShare = () => {
    if (!t) return
    const link = `${window.location.origin}/tournament/${t.id}`
    navigator.clipboard.writeText(link)
    toast.success('Tournament link copied')
  }

  if (loading) {
    return (
      <div className="px-5 pt-16 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-pitch-surface animate-pulse" />
        ))}
      </div>
    )
  }

  if (!t) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50dvh] gap-3">
        <p className="text-pitch-text-secondary">Tournament not found</p>
        <Link href="/" className="text-sm text-pitch-primary">Back to Home</Link>
      </div>
    )
  }

  const matches = t.matches.filter((m) => m.teamA && m.teamB)
  const completedMatches = matches.filter((m) => m.status === 'completed')
  const allDone = t.status === 'active' && matches.length > 0 && matches.every((m) => m.status === 'completed')

  const rounds = ['r16', 'quarter', 'semi', 'final'] as const
  const grouped = rounds
    .map((r) => ({ round: r, matches: matches.filter((m) => m.round === r) }))
    .filter((g) => g.matches.length > 0)

  return (
    <main className="pb-6">
      <header className="sticky top-0 z-40 bg-pitch-bg/95 backdrop-blur border-b hairline">
        <div className="px-4 py-2.5 flex items-center gap-3">
          <Link href="/" className="p-1.5 -ml-1.5 rounded-lg hover:bg-pitch-surface/60">
            <ArrowLeft className="w-5 h-5 text-pitch-text" />
          </Link>
          <h1 className="text-sm font-semibold text-pitch-text truncate flex-1">{t.name}</h1>
          <button onClick={handleShare} className="p-1.5 rounded-lg hover:bg-pitch-surface/60" title="Copy pear:// link">
            <Share2 className="w-4 h-4 text-pitch-text-secondary" />
          </button>
        </div>

        <div className="flex items-center gap-1 px-4 pb-2.5">
          <div className={`w-1.5 h-1.5 rounded-full ${t.status === 'active' ? 'bg-pitch-primary animate-pulse' : t.status === 'completed' ? 'bg-pitch-text-tertiary' : 'bg-pitch-accent'}`} />
          <span className="text-[10px] font-semibold text-pitch-text-secondary uppercase tracking-wide">
            {t.status === 'registration' ? 'Registration' : t.status === 'active' ? 'Live' : 'Completed'}
          </span>
          <span className="text-[10px] text-pitch-text-tertiary ml-auto">{t.totalPrizePool} USDt pool</span>
        </div>

        <div className="px-4 pb-2.5 flex gap-5 border-b hairline">
          {(['bracket', 'teams', 'results'] as const).map((tb) => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className={`text-xs font-semibold pb-2 -mb-2.5 border-b-2 transition-colors ${
                tab === tb ? 'border-pitch-primary text-pitch-primary' : 'border-transparent text-pitch-text-secondary hover:text-pitch-text'
              }`}
            >
              {tb === 'bracket' ? 'Bracket' : tb === 'teams' ? 'Teams' : 'Results'}
            </button>
          ))}
        </div>
      </header>

      <div className="px-5 pt-4">
        {tab === 'bracket' && (
          <div className="space-y-6">
            {grouped.map((group) => (
              <section key={group.round}>
                <div className="flex items-center gap-2 mb-3 sticky top-[89px] z-30 bg-pitch-bg/95 py-2">
                  <span className="text-[10px] font-semibold text-pitch-text-secondary uppercase tracking-widest">
                    {roundLabel({ id: group.round, round: group.round } as Match)}
                  </span>
                  <div className="h-px flex-1 bg-white/[0.04]" />
                  <span className="text-[10px] text-pitch-text-tertiary">
                    {group.matches.filter((m) => m.status === 'completed').length}/{group.matches.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {group.matches.map((match) => (
                    <div
                      key={match.id}
                      className={`rounded-xl border transition-colors ${
                        editingMatch === match.id
                          ? 'bg-pitch-elevated border-pitch-primary/40'
                          : match.status === 'completed'
                          ? 'bg-pitch-surface border-white/[0.04]'
                          : 'bg-pitch-surface border-white/[0.06]'
                      }`}
                    >
                      <div className="p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${match.winner === match.teamA ? 'bg-pitch-primary' : 'bg-white/[0.12]'}`} />
                              <span className={`text-sm truncate ${match.winner === match.teamA ? 'font-bold text-pitch-primary' : 'text-pitch-text'}`}>
                                {match.teamA}
                              </span>
                              {match.status === 'completed' && (
                                <span className={`text-base font-bold tnum ml-auto ${match.winner === match.teamA ? 'text-pitch-primary' : 'text-pitch-text-secondary'}`}>
                                  {match.scoreA}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${match.winner === match.teamB ? 'bg-pitch-primary' : 'bg-white/[0.12]'}`} />
                              <span className={`text-sm truncate ${match.winner === match.teamB ? 'font-bold text-pitch-primary' : 'text-pitch-text'}`}>
                                {match.teamB}
                              </span>
                              {match.status === 'completed' && (
                                <span className={`text-base font-bold tnum ml-auto ${match.winner === match.teamB ? 'text-pitch-primary' : 'text-pitch-text-secondary'}`}>
                                  {match.scoreB}
                                </span>
                              )}
                            </div>
                            {match.penalties && (
                              <p className="text-[10px] text-pitch-text-tertiary ml-4 mt-1">
                                ({match.penalties.a}-{match.penalties.b} pens)
                              </p>
                            )}
                          </div>
                        </div>

                        {match.status === 'pending' && t.status === 'active' && editingMatch !== match.id && (
                          <button
                            onClick={() => { setEditingMatch(match.id); setScoreA(''); setScoreB('') }}
                            className="mt-2.5 w-full py-2 rounded-lg bg-pitch-primary/10 text-pitch-primary text-xs font-semibold hover:bg-pitch-primary/20 transition-colors"
                          >
                            Enter Score
                          </button>
                        )}

                        {editingMatch === match.id && (
                          <div className="mt-2.5 space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 relative">
                                <input
                                  type="number"
                                  value={scoreA}
                                  onChange={(e) => setScoreA(e.target.value)}
                                  placeholder={match.teamA}
                                  className="w-full px-3 py-2 rounded-lg bg-pitch-surface border hairline text-sm text-pitch-text tnum text-center focus:outline-none focus:border-pitch-primary/40"
                                  autoFocus
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-pitch-text-tertiary">{match.teamA.slice(0, 3).toUpperCase()}</span>
                              </div>
                              <span className="text-pitch-text-tertiary text-xs">-</span>
                              <div className="flex-1 relative">
                                <input
                                  type="number"
                                  value={scoreB}
                                  onChange={(e) => setScoreB(e.target.value)}
                                  placeholder={match.teamB}
                                  className="w-full px-3 py-2 rounded-lg bg-pitch-surface border hairline text-sm text-pitch-text tnum text-center focus:outline-none focus:border-pitch-primary/40"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-pitch-text-tertiary">{match.teamB.slice(0, 3).toUpperCase()}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => setEditingMatch(null)} className="flex-1 py-2 rounded-lg bg-pitch-surface border hairline text-xs font-semibold text-pitch-text-secondary">Cancel</button>
                              <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2 rounded-lg bg-pitch-primary text-black text-xs font-semibold disabled:opacity-50">{submitting ? 'Saving...' : 'Save'}</button>
                            </div>
                          </div>
                        )}

                        {match.status === 'completed' && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <Check className="w-3 h-3 text-pitch-primary" />
                            <p className="text-[10px] text-pitch-primary font-medium">{match.winner} advance</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {matches.length === 0 && (
              <div className="text-center py-16">
                <Swords className="w-8 h-8 text-pitch-text-tertiary mx-auto" strokeWidth={1} />
                <p className="text-sm text-pitch-text-secondary mt-3">Bracket appears once teams join</p>
              </div>
            )}
          </div>
        )}

        {tab === 'teams' && (
          <div className="space-y-1.5">
            {t.teams.map((team, idx) => (
              <div key={team.id} className="flex items-center gap-3 p-3 rounded-xl bg-pitch-surface border hairline">
                <div className="w-8 h-8 rounded-full bg-pitch-elevated flex items-center justify-center text-xs font-bold text-pitch-text-secondary">
                  {idx + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-pitch-text">{team.name}</p>
                  <p className="text-[10px] text-pitch-text-tertiary font-mono">{team.captainAddress.slice(0, 10)}...</p>
                </div>
              </div>
            ))}
            {t.teams.length < t.teamSize && t.status === 'registration' && (
              <button onClick={handleJoin} disabled={joining} className="mt-3 w-full py-3 rounded-xl bg-pitch-primary text-black font-semibold text-sm disabled:opacity-50">
                {joining ? 'Joining...' : `Join Tournament (${t.teams.length}/${t.teamSize})`}
              </button>
            )}
            {t.teams.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-8 h-8 text-pitch-text-tertiary mx-auto" strokeWidth={1} />
                <p className="text-sm text-pitch-text-secondary mt-3">Share this tournament to get teams</p>
                <div className="mt-4 p-3 rounded-xl bg-pitch-elevated border hairline text-left">
                  <p className="text-[10px] text-pitch-text-tertiary font-mono break-all select-all">
                    {typeof window !== 'undefined' ? `${window.location.origin}/tournament/${t.id}` : ''}
                  </p>
                </div>
                <button onClick={handleShare} className="mt-3 text-xs text-pitch-primary font-medium">
                  Copy link
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'results' && (
          <div className="space-y-2">
            {completedMatches.map((match) => (
              <div key={match.id} className="p-4 rounded-xl bg-pitch-surface border hairline">
                <p className="text-[10px] font-semibold text-pitch-text-secondary uppercase tracking-wide mb-2">{roundLabel(match)}</p>
                <div className="flex items-center justify-center gap-3">
                  <span className={`text-sm ${match.winner === match.teamA ? 'font-bold text-pitch-primary' : 'text-pitch-text-secondary'}`}>{match.teamA}</span>
                  <span className="text-base font-bold text-pitch-text tnum">{match.scoreA} - {match.scoreB}</span>
                  <span className={`text-sm ${match.winner === match.teamB ? 'font-bold text-pitch-primary' : 'text-pitch-text-secondary'}`}>{match.teamB}</span>
                </div>
                {match.penalties && (
                  <p className="text-[10px] text-pitch-text-tertiary text-center mt-1">({match.penalties.a}-{match.penalties.b} pens)</p>
                )}
              </div>
            ))}

            {allDone && (
              <button onClick={handleSettle} className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-pitch-accent text-black font-semibold text-sm hover:bg-yellow-500 transition-colors">
                <Crown className="w-4 h-4" /> Settle and Payout
              </button>
            )}

            {completedMatches.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="w-8 h-8 text-pitch-text-tertiary mx-auto" strokeWidth={1} />
                <p className="text-sm text-pitch-text-secondary mt-3">No results yet. Enter scores in the Bracket tab.</p>
              </div>
            )}
          </div>
        )}

        {t.status !== 'completed' && (
          <div className="mt-6 pt-4 border-t hairline flex gap-3">
            <Link
              href={`/pot/create`}
              className="flex items-center gap-1.5 text-xs text-pitch-accent hover:underline"
            >
              <Coins className="w-3.5 h-3.5" /> Create pot
            </Link>
            <Link
              href="/assistant"
              className="flex items-center gap-1.5 text-xs text-pitch-text-secondary hover:underline"
            >
              <Zap className="w-3.5 h-3.5" /> AI match analysis
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
