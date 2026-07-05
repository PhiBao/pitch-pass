# Pitch Pass — Tether Developers Cup 2026

**Community-owned football tournaments. Self-custodial prizes. P2P settlement.**

Pitch Pass lets football communities run tournaments without a platform. Create a knockout bracket, share a `pear://` invite link backed by a real Hypercore with DHT discovery, collect entry fees in USDt via self-custodial wallets, and auto-settle prizes when the final whistle blows. Prediction pots on every match. AI-powered match recaps and analysis with streaming output.

The World Cup 2026 quarter-finals are live on the platform. Enter scores, advance the bracket, settle payouts. Or create your own tournament for your community.

> **Hackathon**: [Tether Developers Cup](https://dorahacks.io/hackathon/tether-developers-cup)
> **Tracks**: Pears (P2P) + WDK (Wallets)
> **Theme**: Football and the global tournament moment

---

## Stack

| Track | Technology | Usage |
|---|---|---|
| **Pears (P2P)** | `corestore`, `hypercore`, `@hyperswarm/dht`, `sodium-javascript` | Real Hypercore per tournament via Corestore. DHT announcement and replication. `pear://` invite links with real discovery keys. State mutations appended as JSON entries. |
| **WDK (Wallets)** | `@tetherto/wdk`, `ethers` | BIP39 seed generation via WDK. Real EVM address derivation (`m/44'/60'/0'/0/0`). Live Sepolia USDt balance from on-chain contract. Real Sepolia USDt transfer (send). |
| **AI** | [DGrid API](https://dgrid.ai) (`openai/gpt-4o-mini`) | Context-aware match recaps and predictions with real team names, scores, and tournament round. Server-Sent Events streaming output. Works on any tournament. |

---

## Architecture

```
Next.js 16 (React 19 + TypeScript + Tailwind v4)
├── Frontend
│   ├── /                          Home — tournaments, pots, P2P peer status
│   ├── /tournament/create         Create knockout tournaments, show pear:// + share links
│   ├── /tournament/[id]           Bracket (R16 → QF → SF → Final), score entry, settle, P2P pill
│   ├── /pot/create                Create prediction pots on matches
│   ├── /pot/[id]                  Enter picks (wallet-linked), auto-settle from bracket result
│   ├── /assistant                 DGrid AI: streaming recaps and predictions, any tournament
│   └── /wallet                    Self-custodial wallet (WDK seed, live Sepolia balance, real send)
├── API Routes
│   ├── /api/tournament            Hypercore-backed CRUD, bracket, payouts, peer info
│   ├── /api/pot                   Pot create/enter (auto-settles on match result)
│   ├── /api/ai                    DGrid AI streaming completions (SSE)
│   └── /api/wallet                Wallet create/import/balance/send (WDK + ethers + Sepolia)
└── Services
    ├── src/services/peers.ts        P2P: Corestore lifecycle, DHT node, replication
    ├── src/services/tournament.ts   Engine: key gen, 4-round bracket, Hypercore persistence
    └── src/services/wallet-service.ts Wallet: WDK seed gen, ethers EVM, Sepolia USDT
```

---

## Quick Start

```bash
pnpm install
pnpm approve-builds sharp unrs-resolver
cp .env.example .env.local
# Add your DGRID_API_KEY and WDK_INDEXER_API_KEY to .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

| Variable | Required | Description |
|---|---|---|
| `DGRID_API_KEY` | No | DGrid AI API key for match analysis. AI shows a configuration notice if not set. |
| `SEPOLIA_RPC_URL` | No | Sepolia RPC endpoint. Defaults to `https://ethereum-sepolia-rpc.publicnode.com`. |

---

## Features

### Tournament System
- Create knockout tournaments (4 to 64 teams) with USDt entry fees
- Real Hypercore per tournament via Corestore — state snapshots appended on every mutation
- DHT announcement and replication (`@hyperswarm/dht`)
- Share `pear://` invite links with embedded Hypercore discovery keys
- Enter match scores via inline editor, bracket auto-advances
- Settle tournament for automatic prize distribution (50/30/20 split)
- P2P status pill in header shows peer count and replication state

### Prediction Pots
- Create pots on any pending match with real team names
- Players pick Team A, Draw, or Team B with a USDt stake
- Entries linked to the connected self-custodial wallet address
- Transparent pool: entries, total pool, potential payout per winner
- Auto-settle when bracket result is entered — pot outcome always matches match result

### AI Assistant
- Select any match from any tournament
- Generate contextual match recaps (completed matches) with real scores
- Generate match predictions (upcoming matches) with team analysis
- Real-time streaming output via Server-Sent Events
- Powered by DGrid AI via OpenAI-compatible endpoint

### Self-Custodial Wallet
- Create new wallet — BIP39 seed generation via WDK
- Real EVM address derived from seed (`m/44'/60'/0'/0/0`) via ethers
- Import existing wallet from seed phrase
- Live Sepolia USDt balance (on-chain, from USDT contract at `0xd077a4...` on Sepolia)
- Balance queries use the public address only (seed never leaves the client for read ops)
- Real Sepolia USDt send with transaction hash display (seed used only for signing)
- Persistent across sessions (localStorage)

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

- `sodium-javascript` generates real 32-byte Ed25519 key pairs for tournament identity
- `corestore` manages one Hypercore per tournament on disk
- `hypercore` instances store tournament events as append-only JSON log entries
- `@hyperswarm/dht` announces cores for peer discovery and replication
- `pear://pitchpass/tournament/{id}?key={discoveryKey}` invite links carry real DHT discovery keys
- P2P status visible on the tournament page: peer count and replication state

## WDK Track

- `@tetherto/wdk.getRandomSeedPhrase()` for BIP39 seed generation
- `ethers.HDNodeWallet.fromPhrase()` derives real EVM address via `m/44'/60'/0'/0/0`
- Live Sepolia USDt balance from the on-chain USDT contract
- Real Sepolia USDt send — `contract.transfer()` with tx hash display
- Create/import wallet flow with persistent localStorage storage
- Wallet address connected to pot entries for accountable predictions

---

## Tech Stack

- Next.js 16 / React 19 / TypeScript / Tailwind CSS v4
- Geist + Geist Mono (next/font) / lucide-react / sonner / motion
- Pears: hypercore, @hyperswarm/dht, corestore, autobase, hyperbee, sodium-javascript, b4a
- WDK: @tetherto/wdk, ethers
- AI: DGrid API (dgrid.ai) — SSE streaming

## License

Apache-2.0
