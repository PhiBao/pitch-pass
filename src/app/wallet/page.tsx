'use client'

import { ArrowLeft, WalletIcon, Copy, Key, ArrowUpRight, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
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
  const [mode, setMode] = useState<'choice' | 'create' | 'import' | 'send'>('choice')
  const [importSeed, setImportSeed] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSeed, setShowSeed] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [sendTo, setSendTo] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [sendTxHash, setSendTxHash] = useState('')

  useEffect(() => {
    const stored = loadStoredWallet()
    if (stored) {
      setWallet(stored)
      fetchBalance(stored.address)
    }
    setHydrated(true)
  }, [])

  const fetchBalance = async (addr: string) => {
    setBalanceLoading(true)
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'balance', address: addr }),
      })
      const data = await res.json()
      if (!data.error) setBalance(data.balance)
    } catch {} finally {
      setBalanceLoading(false)
    }
  }

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
      setBalance(data.wallet.balance)
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
      setBalance(data.wallet.balance)
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

  const handleSend = async () => {
    if (!wallet || !sendTo.trim() || !sendAmount) return
    setLoading(true)
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          seed: wallet.seed,
          to: sendTo.trim(),
          amount: parseFloat(sendAmount),
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSendTxHash(data.txHash)
      toast.success('Transfer sent', {
        description: `TX: ${data.txHash.slice(0, 10)}...`,
      })
      fetchBalance(wallet.address)
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

  if (wallet && mode !== 'send') {
    return (
      <main className="pb-6">
        <header className="sticky top-0 z-40 bg-pitch-bg/95 backdrop-blur border-b hairline">
          <div className="px-4 py-2.5 flex items-center justify-between">
            <Link href="/" className="p-1.5 -ml-1.5 rounded-lg hover:bg-pitch-surface/60">
              <ArrowLeft className="w-5 h-5 text-pitch-text" />
            </Link>
            <h1 className="text-base font-semibold text-pitch-text">Wallet</h1>
            <button
              onClick={() => wallet && fetchBalance(wallet.address)}
              className="p-1.5 rounded-lg hover:bg-pitch-surface/60"
              title="Refresh balance"
            >
              <RefreshCw className={`w-4 h-4 text-pitch-text-secondary ${balanceLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        <div className="px-5 pt-4 space-y-4">
          <div className="rounded-2xl bg-pitch-surface border hairline p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-pitch-primary/10 flex items-center justify-center">
                <WalletIcon className="w-5 h-5 text-pitch-primary" />
              </div>
              <div>
                <p className="text-xs text-pitch-text-secondary">Self-Custodial</p>
                <p className="text-sm font-semibold text-pitch-text">Sepolia Testnet</p>
              </div>
            </div>

            <div className="text-center py-2">
              <p className="text-[10px] text-pitch-text-secondary uppercase tracking-wide mb-1">Balance</p>
              <p className="text-3xl font-bold text-pitch-text tnum">
                {balanceLoading ? '...' : (balance !== null ? `${balance} USDt` : 'Loading...')}
              </p>
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

          {sendTxHash && (
            <div className="rounded-xl bg-pitch-success/10 border border-pitch-success/20 p-4">
              <p className="text-[10px] font-semibold text-pitch-text-secondary uppercase tracking-wide mb-1">Last Transaction</p>
              <p className="text-xs font-mono text-pitch-success break-all">
                {sendTxHash}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setMode('send')}
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
            onClick={() => { setWallet(null); setShowSeed(false); setMode('choice'); setBalance(null); clearStoredWallet() }}
            className="w-full py-2.5 text-xs text-pitch-text-secondary hover:text-pitch-text"
          >
            Disconnect
          </button>
        </div>
      </main>
    )
  }

  if (wallet && mode === 'send') {
    return (
      <main className="pb-6">
        <header className="sticky top-0 z-40 bg-pitch-bg/95 backdrop-blur border-b hairline">
          <div className="px-4 py-2.5 flex items-center gap-3">
            <button onClick={() => { setMode('choice'); setSendTxHash('') }} className="p-1.5 -ml-1.5 rounded-lg hover:bg-pitch-surface/60">
              <ArrowLeft className="w-5 h-5 text-pitch-text" />
            </button>
            <h1 className="text-base font-semibold text-pitch-text">Send USDt</h1>
          </div>
        </header>

        <div className="px-5 pt-4 space-y-4">
          <div className="rounded-xl bg-pitch-surface border hairline p-4">
            <p className="text-[10px] text-pitch-text-secondary uppercase tracking-wide mb-1">From</p>
            <p className="text-xs font-mono text-pitch-text-secondary break-all">{wallet.address}</p>
            <p className="text-xs text-pitch-text-tertiary mt-1">
              Balance: {balance !== null ? `${balance} USDt` : 'Loading...'}
            </p>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-pitch-text-secondary uppercase tracking-wide block mb-2">To Address</label>
            <input
              type="text"
              value={sendTo}
              onChange={(e) => setSendTo(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 rounded-xl bg-pitch-surface border hairline text-sm text-pitch-text font-mono placeholder:text-pitch-text-tertiary focus:outline-none focus:border-pitch-primary/40"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-pitch-text-secondary uppercase tracking-wide block mb-2">Amount (USDt)</label>
            <input
              type="number"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="w-full px-4 py-3 rounded-xl bg-pitch-surface border hairline text-sm text-pitch-text tnum focus:outline-none focus:border-pitch-primary/40"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={loading || !sendTo.trim() || !sendAmount}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-pitch-primary text-black font-semibold text-sm disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send USDt'}
          </button>

          <button
            onClick={() => { setMode('choice'); setSendTxHash('') }}
            className="w-full py-2.5 text-xs text-pitch-text-secondary hover:text-pitch-text"
          >
            Cancel
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
            <WalletIcon className="w-8 h-8 text-pitch-primary" />
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
