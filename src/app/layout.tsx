import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { AppShell } from './app-shell'
import './globals.css'

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pitch Pass — World Cup 2026 Tournament',
  description: 'Community-owned football tournaments. Self-custodial prizes in USDt. P2P settlement.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} font-sans bg-pitch-bg text-pitch-text antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
