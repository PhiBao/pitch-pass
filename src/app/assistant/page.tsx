'use client'

import { ArrowLeft, Sparkles, Trophy, Zap, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { Tournament, Match } from '@/types/tournament'

export default function AssistantPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [aiConfigured, setAiConfigured] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/tournament')
      const data = await res.json()
      const all = data.tournaments || []
      setTournaments(all)
      if (all.length > 0) {
        const firstActive = all.find((t: Tournament) => t.status !== 'completed') || all[0]
        setTournament(firstActive)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const generate = async (type: 'recap' | 'pick') => {
    if (!selectedMatch) return
    setGenerating(true)
    setError('')
    setOutput('')

    const context = type === 'recap'
      ? `${selectedMatch.teamA} ${selectedMatch.scoreA} - ${selectedMatch.scoreB} ${selectedMatch.teamB} in the ${tournament?.name || ''} ${selectedMatch.round === 'r16' ? 'Round of 16' : selectedMatch.round === 'quarter' ? 'Quarter-Final' : selectedMatch.round === 'semi' ? 'Semi-Final' : 'Final'}. Winner: ${selectedMatch.winner || 'TBD'}.`
      : `${selectedMatch.teamA} vs ${selectedMatch.teamB} in the ${tournament?.name || ''} ${selectedMatch.round === 'r16' ? 'Round of 16' : selectedMatch.round === 'quarter' ? 'Quarter-Final' : selectedMatch.round === 'semi' ? 'Semi-Final' : 'Final'}.`

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, matchContext: context }),
      })

      if (res.status === 503) {
        setAiConfigured(false)
        setError('AI is not configured (set DGRID_API_KEY in .env.local)')
        return
      }

      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('text/plain')) {
        const reader = res.body?.getReader()
        if (!reader) throw new Error('No response body')
        const decoder = new TextDecoder()
        let result = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          result += chunk
          setOutput(result)
        }
      } else {
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setOutput(data.text)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate')
      toast.error(err.message)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="px-5 pt-16 space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-pitch-surface animate-pulse" />)}
      </div>
    )
  }

  if (tournaments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50dvh] gap-3">
        <p className="text-pitch-text-secondary">No tournaments available</p>
        <Link href="/tournament/create" className="text-sm text-pitch-primary">Create one</Link>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50dvh] gap-3">
        <p className="text-pitch-text-secondary">No tournament data</p>
        <Link href="/" className="text-sm text-pitch-primary">Home</Link>
      </div>
    )
  }

  const roundLabel = (m: Match): string => {
    if (m.round === 'r16') return 'R16'
    if (m.round === 'quarter') return 'QF'
    if (m.round === 'semi') return 'SF'
    return 'Final'
  }

  const completed = tournament.matches.filter((m) => m.status === 'completed' && m.teamA && m.teamB)
  const upcoming = tournament.matches.filter((m) => m.status === 'pending' && m.teamA && m.teamB)

  return (
    <main className="pb-6">
      <header className="sticky top-0 z-40 bg-pitch-bg/95 backdrop-blur border-b hairline">
        <div className="px-4 py-2.5 flex items-center gap-3">
          <Link href="/" className="p-1.5 -ml-1.5 rounded-lg hover:bg-pitch-surface/60">
            <ArrowLeft className="w-5 h-5 text-pitch-text" />
          </Link>
          <h1 className="text-base font-semibold text-pitch-text">AI Assistant</h1>
        </div>
      </header>

      <div className="px-5 pt-4 space-y-4">
        <div className="flex justify-center py-2">
          <div className="w-14 h-14 rounded-2xl bg-pitch-primary/10 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-pitch-primary" />
          </div>
        </div>

        {tournaments.length > 1 && (
          <div>
            <p className="text-[10px] font-semibold text-pitch-text-secondary uppercase tracking-wide block mb-2">Tournament</p>
            <div className="space-y-1.5">
              {tournaments.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTournament(t); setSelectedMatch(null); setOutput(''); setError('') }}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${
                    tournament.id === t.id
                      ? 'bg-pitch-elevated border-pitch-primary/40'
                      : 'bg-pitch-surface hairline'
                  }`}
                >
                  <p className="text-sm font-semibold text-pitch-text">{t.name}</p>
                  <p className="text-[10px] text-pitch-text-tertiary mt-0.5">{t.teams.length} teams</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {!aiConfigured && (
          <div className="p-4 rounded-xl bg-pitch-accent/10 border border-pitch-accent/20 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-pitch-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-pitch-accent">AI not configured</p>
              <p className="text-xs text-pitch-text-secondary mt-0.5">
                Add <code className="text-pitch-accent/80">DGRID_API_KEY</code> to your .env.local file to enable match intelligence.
              </p>
            </div>
          </div>
        )}

        <div>
          <p className="text-[10px] font-semibold text-pitch-text-secondary uppercase tracking-wide mb-2">
            Select a match
          </p>

          {completed.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] text-pitch-text-tertiary mb-1.5">Completed</p>
              <div className="space-y-1">
                {completed.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMatch(m)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors ${
                      selectedMatch?.id === m.id
                        ? 'bg-pitch-elevated border-pitch-primary/40'
                        : 'bg-pitch-surface hairline'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-pitch-text">
                        {m.teamA} {m.scoreA}-{m.scoreB} {m.teamB}
                      </span>
                      <span className="text-[10px] text-pitch-text-tertiary">{roundLabel(m)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {upcoming.length > 0 && (
            <div>
              <p className="text-[10px] text-pitch-text-tertiary mb-1.5">Upcoming</p>
              <div className="space-y-1">
                {upcoming.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMatch(m)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors ${
                      selectedMatch?.id === m.id
                        ? 'bg-pitch-elevated border-pitch-primary/40'
                        : 'bg-pitch-surface hairline'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-pitch-text">{m.teamA} vs {m.teamB}</span>
                      <span className={`text-[10px] ${
                        selectedMatch?.id === m.id ? 'text-pitch-primary' : 'text-pitch-text-tertiary'
                      }`}>
                        {roundLabel(m)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedMatch && (
          <div className="space-y-3">
            {selectedMatch.status === 'completed' && (
              <button
                onClick={() => generate('recap')}
                disabled={generating || !aiConfigured}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-pitch-surface border hairline hover:border-pitch-primary/30 transition-colors disabled:opacity-50"
              >
                <Trophy className="w-5 h-5 text-pitch-accent shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-pitch-text">Generate Recap</p>
                  <p className="text-xs text-pitch-text-secondary mt-0.5">
                    Match report for {selectedMatch.teamA} {selectedMatch.scoreA}-{selectedMatch.scoreB} {selectedMatch.teamB}
                  </p>
                </div>
              </button>
            )}

            {selectedMatch.status === 'pending' && (
              <button
                onClick={() => generate('pick')}
                disabled={generating || !aiConfigured}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-pitch-surface border hairline hover:border-pitch-primary/30 transition-colors disabled:opacity-50"
              >
                <Zap className="w-5 h-5 text-sky-400 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-pitch-text">Generate Prediction</p>
                  <p className="text-xs text-pitch-text-secondary mt-0.5">
                    Analysis for {selectedMatch.teamA} vs {selectedMatch.teamB}
                  </p>
                </div>
              </button>
            )}
          </div>
        )}

        {generating && (
          <div className="flex items-center justify-center gap-2 py-6">
            <div className="w-4 h-4 border-2 border-pitch-primary/30 border-t-pitch-primary rounded-full animate-spin" />
            <span className="text-sm text-pitch-text-secondary">Generating...</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-pitch-danger/10 border border-pitch-danger/20">
            <p className="text-sm text-pitch-danger">{error}</p>
          </div>
        )}

        {output && !generating && (
          <div className="p-4 rounded-xl bg-pitch-surface border hairline">
            <p className="text-[10px] font-semibold text-pitch-text-secondary uppercase tracking-wide mb-2">
              {selectedMatch?.status === 'completed' ? 'Recap' : 'Prediction'}
            </p>
            <p className="text-sm text-pitch-text leading-relaxed">{output}</p>
          </div>
        )}

        <div className="pt-4 text-center">
          <p className="text-[10px] text-pitch-text-tertiary">
            Powered by DGrid AI · openai/gpt-4o-mini · streaming via decentralized gateway
          </p>
        </div>
      </div>
    </main>
  )
}
