'use client'

import { Trophy, Swords, Coins, ArrowRight, Plus, Sparkles, Users, Activity } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Tournament, PredictionPot } from '@/types/tournament'

export default function HomePage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [pots, setPots] = useState<PredictionPot[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [tRes, pRes] = await Promise.all([fetch('/api/tournament'), fetch('/api/pot')])
      const tData = await tRes.json()
      const pData = await pRes.json()
      setTournaments(tData.tournaments || [])
      setPots((pData.pots || []).filter((p: PredictionPot) => p.status !== 'settled'))
    } catch {
      toast.error('Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const wc = tournaments.find((t) => t.id === 'wc2026r16')
  const userTournaments = tournaments.filter((t) => t.id !== 'wc2026r16')
  const activePots = pots.slice(0, 4)

  if (loading) {
    return (
      <div className="px-5 pt-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-pitch-surface animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <main className="pb-6">
      <div className="px-5 pt-8 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-pitch-primary/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-pitch-primary" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-pitch-text">Pitch Pass</h1>
            <p className="text-[11px] text-pitch-text-secondary">Tournaments · Pots · AI</p>
          </div>
        </div>
      </div>

      <div className="px-5 mb-5">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/tournament/create"
            className="flex items-center gap-3 p-4 rounded-xl bg-pitch-primary text-black hover:bg-pitch-primary-dark transition-colors"
          >
            <Plus className="w-5 h-5" strokeWidth={2} />
            <span className="text-sm font-bold">New Tournament</span>
          </Link>
          <Link
            href="/pot/create"
            className="flex items-center gap-3 p-4 rounded-xl bg-pitch-surface border hairline text-pitch-text hover:bg-pitch-elevated transition-colors"
          >
            <Coins className="w-5 h-5 text-pitch-accent" />
            <span className="text-sm font-bold">New Pot</span>
          </Link>
        </div>
      </div>

      {wc && (
        <section className="px-5 mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pitch-primary animate-pulse" />
              <h2 className="text-xs font-semibold text-pitch-text-secondary uppercase tracking-wider">World Cup 2026</h2>
            </div>
            <Link href={`/tournament/${wc.id}`} className="text-[11px] text-pitch-primary font-medium flex items-center gap-1">
              Open <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <Link href={`/tournament/${wc.id}`} className="block rounded-2xl bg-pitch-surface border hairline overflow-hidden hover:border-pitch-primary/20 transition-colors">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold text-pitch-primary uppercase tracking-widest">
                  {wc.matches.filter((m) => m.status === 'pending' && m.teamA && m.teamB).length > 0 ? 'Quarter-Finals' : 'Live'}
                </span>
                <span className="text-[10px] text-pitch-text-tertiary tnum">{wc.totalPrizePool} USDt</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-base font-bold text-pitch-text tnum">{wc.teams.length}</p>
                  <p className="text-[10px] text-pitch-text-secondary mt-0.5">Teams</p>
                </div>
                <div>
                  <p className="text-base font-bold text-pitch-primary tnum">{wc.teams.length - wc.matches.filter((m) => m.status === 'completed').length * 2 + 2}</p>
                  <p className="text-[10px] text-pitch-text-secondary mt-0.5">Remaining</p>
                </div>
                <div>
                  <p className="text-base font-bold text-pitch-accent tnum">{wc.matches.filter((m) => m.status === 'completed').length}</p>
                  <p className="text-[10px] text-pitch-text-secondary mt-0.5">Played</p>
                </div>
              </div>
            </div>

            <div className="border-t hairline px-4 py-2.5 flex items-center gap-4 overflow-x-auto text-[10px] text-pitch-text-tertiary">
              {wc.matches.filter((m) => m.status === 'completed').slice(-3).map((m) => (
                <span key={m.id} className="shrink-0 whitespace-nowrap">
                  {m.teamA.slice(0, 3)} {m.scoreA}-{m.scoreB} {m.teamB.slice(0, 3)}
                </span>
              ))}
            </div>
          </Link>
        </section>
      )}

      {activePots.length > 0 && (
        <section className="px-5 mb-5">
          <h2 className="text-xs font-semibold text-pitch-text-secondary uppercase tracking-wider mb-2.5">Active Pots</h2>
          <div className="space-y-1.5">
            {activePots.map((p) => {
              const related = wc?.matches.find((m) => m.id === p.matchId)
              return (
                <Link
                  key={p.id}
                  href={`/pot/${p.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-pitch-surface border hairline hover:border-pitch-accent/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-pitch-accent/10 flex items-center justify-center shrink-0">
                      <Coins className="w-3.5 h-3.5 text-pitch-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-pitch-text truncate">
                        {related ? `${related.teamA} vs ${related.teamB}` : `Pot ${p.id.slice(0, 6)}`}
                      </p>
                      <p className="text-[10px] text-pitch-text-tertiary">{p.entries.length} entries · {p.totalPool} USDt</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3 h-3 text-pitch-text-tertiary shrink-0" />
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {userTournaments.length > 0 && (
        <section className="px-5 mb-5">
          <h2 className="text-xs font-semibold text-pitch-text-secondary uppercase tracking-wider mb-2.5">Your Tournaments</h2>
          <div className="space-y-1.5">
            {userTournaments.map((t) => (
              <Link
                key={t.id}
                href={`/tournament/${t.id}`}
                className="flex items-center justify-between p-3 rounded-xl bg-pitch-surface border hairline hover:border-pitch-primary/20 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${t.status === 'active' ? 'bg-pitch-primary/10' : 'bg-pitch-accent/10'}`}>
                    <Swords className={`w-3.5 h-3.5 ${t.status === 'active' ? 'text-pitch-primary' : 'text-pitch-accent'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-pitch-text truncate">{t.name}</p>
                    <p className="text-[10px] text-pitch-text-tertiary">{t.teams.length}/{t.teamSize} teams · {t.entryFee} USDt</p>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold ${t.status === 'active' ? 'text-pitch-primary' : 'text-pitch-accent'}`}>
                  {t.status === 'active' ? 'Live' : t.status === 'completed' ? 'Done' : 'Open'}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!wc && userTournaments.length === 0 && (
        <div className="text-center py-16 px-5">
          <Activity className="w-10 h-10 text-pitch-text-tertiary mx-auto" strokeWidth={1} />
          <p className="text-pitch-text mt-5 font-semibold">No tournaments yet</p>
          <p className="text-sm text-pitch-text-secondary mt-2 max-w-xs mx-auto">
            Create a tournament and invite your community via pear:// links. Self-custodial USDt prizes.
          </p>
          <Link
            href="/tournament/create"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-pitch-primary text-black font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Tournament
          </Link>
        </div>
      )}
    </main>
  )
}
