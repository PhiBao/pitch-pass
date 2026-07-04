# Pitch Pass — Tether Developers Cup 2026

**Community-owned football tournaments. Self-custodial prizes. P2P settlement.**

Pitch Pass lets football communities run tournaments without a platform. Create a knockout bracket, share a `pear://` invite link backed by a real Hypercore key pair, collect entry fees in USDt via self-custodial wallets, and auto-settle prizes when the final whistle blows. Prediction pots on every match. AI-powered match recaps and analysis.

The World Cup 2026 quarter-finals are live on the platform. Enter scores, advance the bracket, settle payouts. Or create your own tournament for your community.

> **Hackathon**: [Tether Developers Cup](https://dorahacks.io/hackathon/tether-developers-cup)
> **Tracks**: Pears (P2P) + WDK (Wallets)
> **Theme**: Football and the global tournament moment

---

## Stack

| Track | Technology | Usage |
|---|---|---|
| **Pears (P2P)** | `hypercore`, `sodium-javascript` | Real 32-byte Hypercore key pairs for `pear://` invite links with embedded discovery keys. Tournament events appended as cryptographically-signed log entries. |
| **WDK (Wallets)** | `@tetherto/wdk`, `bip39` | BIP39 seed generation + Ed25519 address derivation from seed. Self-custodial wallet with create/import, Sepolia USDt balance, send/receive. |
| **AI** | [DGrid API](https://dgrid.ai) (`openai/gpt-4o-mini`) | Context-aware match recaps and predictions with real team names, scores, and tournament round passed to the model. |

---

## Architecture

```
Next.js 16 (React 19 + TypeScript + Tailwind v4)
├── Frontend
│   ├── /                          Home — tournaments, pots, create actions
│   ├── /tournament/create         Create knockout tournaments
│   ├── /tournament/[id]           Bracket (R16 → QF → SF → Final), score entry, settle
│   ├── /pot/create                Create prediction pots on matches
│   ├── /pot/[id]                  Enter picks, settle, payout distribution
│   ├── /assistant                 DGrid AI: contextual match recaps and predictions
│   └── /wallet                    Self-custodial wallet (create/import, WDK-backed)
├── API Routes
│   ├── /api/tournament            Hypercore key gen, CRUD, bracket, payouts
│   ├── /api/pot                   Pot create/enter/settle
│   ├── /api/ai                    DGrid AI completions (context-aware)
│   └── /api/wallet                Wallet create/import via WDK + bip39
└── Services
    └── src/services/tournament.ts   Engine: key gen, 4-round bracket, wallet, pots
```

---

## Quick Start

```bash
pnpm install
pnpm approve-builds sharp unrs-resolver
cp .env.example .env.local
# Add your DGRID_API_KEY to .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

| Variable | Required | Description |
|---|---|---|
| `DGRID_API_KEY` | No | DGrid AI API key for match analysis. AI features work with a demo fallback if not set. |

---

## Features

### Tournament System
- Create knockout tournaments (4 to 64 teams) with USDt entry fees
- Auto-generated brackets: R16 → QF → SF → Final
- Share `pear://` invite links with embedded Hypercore discovery keys
- Enter match scores via inline editor, bracket auto-advances
- Settle tournament for automatic prize distribution (50/30/20 split)

### Prediction Pots
- Create pots on any pending match with real team names
- Players pick Team A, Draw, or Team B with a USDt stake
- Transparent pool: entries, total pool, potential payout per winner
- Settle with one tap: winners auto-calculated

### AI Assistant
- Select any match from the active tournament
- Generate contextual match recaps (completed matches) with real scores
- Generate match predictions (upcoming matches) with team analysis
- Powered by DGrid AI via OpenAI-compatible endpoint

### Self-Custodial Wallet
- Create new wallet (BIP39 seed + Ed25519 address via WDK)
- Import existing wallet from seed phrase
- View address, Sepolia testnet balance, seed phrase (reveal/hide)
- Persistent across sessions (localStorage)
- Send and receive Sepolia USDt

### Design
- Warm-tinted dark palette (`#0F1316` base)
- Hairline borders (`rgba(255,255,255,0.06)`) — FotMob/Polymarket convention
- Single saturated green accent (`#1AB943`) — football category standard
- Tricolor spine bar (WC 2026 host identity)
- Tabular numerals everywhere — scores align perfectly
- Bottom nav: Home · Bracket · Pots · AI · Wallet
- Toast notifications (sonner), skeleton loaders, proper empty states

---

## Pears Track

- `sodium-javascript` generates real 32-byte Ed25519 key pairs
- `pear://pitchpass/tournament/{id}?key={discoveryKey}` invite links
- Hypercore instances store tournament event logs
- Active Hypercore info (key + event count) displayed on home page

## WDK Track

- `bip39.generateMnemonic()` for BIP39 seed generation
- Ed25519 key derivation → Ethereum-style address
- `@tetherto/wdk` installed and available for full wallet operations
- Create/import wallet flow with persistent storage

---

## Tech Stack

- Next.js 16 / React 19 / TypeScript / Tailwind CSS v4
- Geist + Geist Mono (next/font) / lucide-react / sonner
- Pears: hypercore, @hyperswarm/dht, autobase, corestore, hyperbee, sodium-javascript, b4a
- WDK: @tetherto/wdk, bip39
- AI: DGrid API (dgrid.ai)

## License

Apache-2.0
