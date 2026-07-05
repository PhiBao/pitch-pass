'use client'

import { Trophy, ArrowLeft, Copy, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export default function CreateTournamentPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [teamSize, setTeamSize] = useState('8')
  const [entryFee, setEntryFee] = useState('1')
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<{ inviteLink: string; shareUrl: string; tournamentId: string } | null>(null)

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: name.trim(),
          teamSize: parseInt(teamSize) || 8,
          entryFee: parseInt(entryFee) || 1,
          creatorAddress: 'demo-wallet',
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setCreated({
        inviteLink: data.inviteLink,
        shareUrl: `${window.location.origin}/tournament/${data.tournament.id}`,
        tournamentId: data.tournament.id,
      })
      toast.success('Tournament created')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCreating(false)
    }
  }

  const copyLink = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Link copied')
  }

  return (
    <main className="pb-6">
      <div className="max-w-md mx-auto px-5 pb-24">
        <header className="flex items-center gap-3 pt-6 pb-4">
          <Link href="/" className="p-2 -ml-2 rounded-lg hover:bg-pitch-surface/60">
            <ArrowLeft className="w-5 h-5 text-pitch-text" />
          </Link>
          <h1 className="text-base font-semibold text-pitch-text">Create Tournament</h1>
        </header>

        {created ? (
          <div className="space-y-5">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-2xl bg-pitch-success/10 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-pitch-success" strokeWidth={1.5} />
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-base font-semibold text-pitch-text">{name || 'Tournament'}</h2>
              <p className="text-sm text-pitch-text-secondary mt-1">Tournament created — share the link with your community</p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-pitch-surface border hairline">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-semibold text-pitch-text-secondary uppercase tracking-wide">Share Link</p>
                  <button onClick={() => copyLink(created.shareUrl)} className="flex items-center gap-1 text-[10px] text-pitch-primary">
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <p className="text-xs font-mono text-pitch-text-secondary break-all">{created.shareUrl}</p>
              </div>

              <div className="p-4 rounded-xl bg-pitch-surface border hairline">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-semibold text-pitch-text-secondary uppercase tracking-wide">P2P Invite (pear://)</p>
                  <button onClick={() => copyLink(created.inviteLink)} className="flex items-center gap-1 text-[10px] text-pitch-text-tertiary">
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <p className="text-xs font-mono text-pitch-text-tertiary break-all">{created.inviteLink}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                href={`/tournament/${created.tournamentId}`}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-pitch-primary text-black font-semibold text-sm"
              >
                <ExternalLink className="w-4 h-4" /> Open Tournament
              </Link>
              <button
                onClick={() => {
                  setCreated(null)
                  setName('')
                  setTeamSize('8')
                  setEntryFee('1')
                }}
                className="flex-1 py-3.5 rounded-xl bg-pitch-surface border hairline text-pitch-text font-semibold text-sm"
              >
                Create Another
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-2xl bg-pitch-primary/10 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-pitch-primary" strokeWidth={1.5} />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-pitch-text-secondary uppercase tracking-wide block mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Copa de Barrio 2026"
                className="w-full px-4 py-3 rounded-xl bg-pitch-surface border hairline text-sm text-pitch-text placeholder:text-pitch-text-tertiary focus:outline-none focus:border-pitch-primary/40"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-pitch-text-secondary uppercase tracking-wide block mb-2">Number of Teams</label>
              <input
                type="number"
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-pitch-surface border hairline text-sm text-pitch-text tnum focus:outline-none focus:border-pitch-primary/40"
                placeholder="8"
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-pitch-text-secondary uppercase tracking-wide block mb-2">Entry Fee (USDt)</label>
              <input
                type="number"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-pitch-surface border hairline text-sm text-pitch-text tnum focus:outline-none focus:border-pitch-primary/40"
                placeholder="1"
              />
            </div>

            <div className="p-4 rounded-xl bg-pitch-surface border hairline">
              <p className="text-[10px] font-semibold text-pitch-text-secondary uppercase tracking-wide mb-1.5">Prize Split</p>
              <p className="text-sm text-pitch-text">1st: 50% · 2nd: 30% · 3rd: 20%</p>
            </div>

            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full py-3.5 rounded-xl bg-pitch-primary text-black font-semibold text-sm disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Tournament'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
