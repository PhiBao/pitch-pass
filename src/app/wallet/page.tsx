'use client'

import { ArrowLeft, Wallet, Copy, Key, Download, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import type { WalletState } from '@/types/tournament'

const STORAGE_KEY = 'pitchpass:wallet'

function loadStoredWallet(): WalletState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function storeWallet(w: WalletState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(w)) } catch {}
}

function clearStoredWallet() {
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletState | null>(null)
  const [mode, setMode] = useState<'choice' | 'create' | 'import'>('choice')
  const [importSeed, setImportSeed] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSeed, setShowSeed] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = loadStoredWallet()
    if (stored) setWallet(stored)
    setHydrated(true)
  }, [])

  const handleCreate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setWallet(data.wallet)
      storeWallet(data.wallet)
      setMode('choice')
      toast.success('Wallet created')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!importSeed.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import', seed: importSeed.trim() }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setWallet(data.wallet)
      storeWallet(data.wallet)
      setMode('choice')
      setImportSeed('')
      toast.success('Wallet imported')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyAddress = () => {
    if (!wallet) return
    navigator.clipboard.writeText(wallet.address)
    toast.success('Address copied')
  }

  if (!hydrated) return null

  if (wallet) {
    return (
      <main className="pb-6">
        <header className="sticky top-0 z-40 bg-pitch-bg/95 backdrop-blur border-b hairline">
          <div className="px-4 py-2.5 flex items-center justify-between">
            <Link href="/" className="p-1.5 -ml-1.5 rounded-lg hover:bg-pitch-surface/60">
              <ArrowLeft className="w-5 h-5 text-pitch-text" />
            </Link>
            <h1 className="text-base font-semibold text-pitch-text">Wallet</h1>
            <div className="w-9" />
          </div>
        </header>

        <div className="px-5 pt-4 space-y-4">
          <div className="rounded-2xl bg-pitch-surface border hairline p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-pitch-primary/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-pitch-primary" />
              </div>
              <div>
                <p className="text-xs text-pitch-text-secondary">Self-Custodial</p>
                <p className="text-sm font-semibold text-pitch-text">Sepolia Testnet</p>
              </div>
            </div>

            <div className="text-center py-2">
              <p className="text-[10px] text-pitch-text-secondary uppercase tracking-wide mb-1">Balance</p>
              <p className="text-3xl font-bold text-pitch-text tnum">{wallet.balance} USDt</p>
            </div>

            <div className="mt-4 flex items-center gap-2 p-2.5 rounded-xl bg-pitch-elevated">
              <p className="text-[10px] text-pitch-text-tertiary font-mono truncate flex-1">{wallet.address}</p>
              <button onClick={copyAddress} className="p-1.5 rounded-lg hover:bg-pitch-surface/60">
                <Copy className="w-3.5 h-3.5 text-pitch-text-secondary" />
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-pitch-surface border hairline p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-pitch-text-secondary uppercase tracking-wide">Seed Phrase</p>
              <button
                onClick={() => setShowSeed(!showSeed)}
                className="text-[10px] text-pitch-primary font-medium"
              >
                {showSeed ? 'Hide' : 'Reveal'}
              </button>
            </div>
            {showSeed && (
              <p className="text-xs font-mono text-pitch-text mt-3 bg-pitch-elevated p-3 rounded-lg break-words leading-relaxed">
                {wallet.seed}
              </p>
            )}
          </div>

          <div className="rounded-xl bg-pitch-surface border hairline p-4">
            <p className="text-[10px] font-semibold text-pitch-text-secondary uppercase tracking-wide mb-3">Recent</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-pitch-success/10 flex items-center justify-center">
                  <Download className="w-3.5 h-3.5 text-pitch-success" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-pitch-text">Sepolia faucet</p>
                  <p className="text-[10px] text-pitch-text-tertiary">Testnet deposit</p>
                </div>
                <span className="text-xs font-semibold text-pitch-success tnum">+100 USDt</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => toast.info('Send flow. Use the WDK SDK for real transactions on Sepolia.')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-pitch-primary text-black font-semibold text-sm"
            >
              <ArrowUpRight className="w-4 h-4" />
              Send
            </button>
            <button
              onClick={copyAddress}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-pitch-surface border hairline text-pitch-text font-semibold text-sm"
            >
              <Copy className="w-4 h-4" />
              Receive
            </button>
          </div>

          <button
            onClick={() => { setWallet(null); setShowSeed(false); setMode('choice'); clearStoredWallet() }}
            className="w-full py-2.5 text-xs text-pitch-text-secondary hover:text-pitch-text"
          >
            Disconnect
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="pb-6">
      <header className="sticky top-0 z-40 bg-pitch-bg/95 backdrop-blur border-b hairline">
        <div className="px-4 py-2.5 flex items-center gap-3">
          <Link href="/" className="p-1.5 -ml-1.5 rounded-lg hover:bg-pitch-surface/60">
            <ArrowLeft className="w-5 h-5 text-pitch-text" />
          </Link>
          <h1 className="text-base font-semibold text-pitch-text">Wallet</h1>
        </div>
      </header>

      <div className="px-5 pt-4 space-y-4">
        <div className="flex justify-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-pitch-primary/10 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-pitch-primary" />
          </div>
        </div>

        {mode === 'choice' && (
          <div className="space-y-3">
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-pitch-primary text-black font-semibold text-sm disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create New Wallet'}
            </button>
            <button
              onClick={() => setMode('import')}
              className="w-full py-4 rounded-xl bg-pitch-surface border hairline text-pitch-text font-semibold text-sm"
            >
              Import Existing &rarr;
            </button>
          </div>
        )}

        {mode === 'import' && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-semibold text-pitch-text-secondary uppercase tracking-wide block mb-2">
                Enter your 12-word seed phrase
              </label>
              <textarea
                value={importSeed}
                onChange={(e) => setImportSeed(e.target.value)}
                placeholder="word1 word2 word3 ... word12"
                className="w-full px-4 py-3 rounded-xl bg-pitch-surface border hairline text-sm text-pitch-text font-mono resize-none h-24 focus:outline-none focus:border-pitch-primary/40"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setMode('choice'); setImportSeed('') }}
                className="flex-1 py-3 rounded-xl bg-pitch-surface border hairline text-pitch-text font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importSeed.trim() || loading}
                className="flex-1 py-3 rounded-xl bg-pitch-primary text-black font-semibold text-sm disabled:opacity-50"
              >
                {loading ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
