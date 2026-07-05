'use client'

import { Toaster } from 'sonner'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Trophy, Swords, Coins, Zap, Wallet } from 'lucide-react'

function BottomNav() {
  const path = usePathname()
  const [bracketHref, setBracketHref] = useState('/tournament/wc2026r16')

  useEffect(() => {
    fetch('/api/tournament')
      .then((r) => r.json())
      .then((data) => {
        const tournaments = data.tournaments || []
        if (tournaments.length > 0) {
          setBracketHref(`/tournament/${tournaments[0].id}`)
        }
      })
      .catch(() => {})
  }, [])

  const tabs = [
    { href: '/', icon: Trophy, label: 'Home' },
    { href: bracketHref, icon: Swords, label: 'Bracket' },
    { href: '/pot/create', icon: Coins, label: 'Pots' },
    { href: '/assistant', icon: Zap, label: 'AI' },
    { href: '/wallet', icon: Wallet, label: 'Wallet' },
  ]
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-pitch-surface/95 backdrop-blur border-t hairline">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const active = tab.href === '/' ? path === '/' : path.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                active ? 'text-pitch-primary' : 'text-pitch-text-tertiary hover:text-pitch-text-secondary'
              }`}
            >
              <tab.icon className="w-5 h-5" strokeWidth={active ? 2 : 1.5} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="h-1 w-full flex">
        <div className="flex-1 bg-pitch-wc-red" />
        <div className="flex-1 bg-pitch-wc-white" />
        <div className="flex-1 bg-pitch-wc-green" />
      </div>
      <div className="max-w-md mx-auto min-h-[calc(100dvh-1rem)] pb-20">
        {children}
      </div>
      <BottomNav />
      <Toaster
        position="top-center"
        offset={60}
        toastOptions={{
          style: {
            background: '#1B2127',
            border: '1px solid rgba(255,255,255,0.06)',
            color: '#F0F4F0',
            fontSize: '14px',
          },
        }}
      />
    </>
  )
}
