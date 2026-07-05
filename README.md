# Pitch Pass — Tether Developers Cup 2026

**A `pear://` link is the whole platform. No server, no middleman, no house cut.** Community football tournaments with self-custodial USDt prizes, P2P state, prediction pots, and AI match intelligence.

> **Hackathon**: [Tether Developers Cup](https://dorahacks.io/hackathon/tether-developers-cup) · **Tracks**: Pears (P2P) + WDK (Wallets) · **Theme**: Football and the global tournament moment

---

## What is Pitch Pass?

Pitch Pass lets anyone run a knockout football tournament. Create a bracket, invite teams with a link, collect entry fees, enter scores as matches happen, and the prize money is distributed automatically when the final whistle blows.

On top of every match, players can stake USDt in prediction pots — pick the winner, split the pool. An AI assistant generates match recaps and predictions streaming in real-time.

Everything runs on your own machine. There is no platform, no service fee, and nobody holds custody of the money.

---

## Why? The Problem

Think about how a local football tournament handles money today:

1. **One person collects cash** from every team captain
2. **That person holds the pool** — a single point of trust and failure
3. **Payouts are manual** — someone has to calculate splits and hand out envelopes
4. **No transparency** — players can't verify the pool, the split, or the outcome
5. **Disputes have no record** — was the score 2-1 or 1-2? Who advanced?

Now scale this up: a community league with 16 teams, a corporate five-a-side with 32 teams, a crypto-native bracket for a World Cup watch party. The same problems exist at every scale, and centralized tournament platforms take a 5–15% cut for hosting.

**Pitch Pass solves this with three primitives:**

- **P2P state** (Pears) — the bracket is a Hypercore. Every score entry is a signed append. Share a `pear://` link and peers replicate the tournament directly. No database, no server, no platform dependency.
- **Self-custodial money** (WDK) — every team captain holds their own keys. Entry fees are real Sepolia USDt. Prizes are calculated transparently from the bracket state. Nobody touches the money except the winners.
- **Verifiable outcomes** — every match result is recorded in the Hypercore log. Prediction pots settle automatically from bracket results. No admin override, no disagreement between what happened and who got paid.

---

## How It Works

### The Core Loop

```
1. CREATE     Someone creates a tournament (name, teams, entry fee)
             → A Hypercore is created. A pear:// link is generated with its discovery key.

2. INVITE     Share the link. Teams join with their self-custodial wallet.
             → Entry fees flow to the tournament. Bracket seeds automatically.

3. PLAY       Enter scores as matches happen.
             → Each result appends a signed entry to the Hypercore.
             → Winners auto-advance to the next round.
             → Prediction pots on that match auto-settle.

4. SETTLE     When the final is complete, one tap settles the tournament.
             → Prize distribution (50/30/20) is calculated from the bracket.
             → Payout amounts are verifiable from the public bracket state.
```

### P2P Replication

Every tournament is a Hypercore — an append-only log discovered via DHT. The `pear://` link carries the discovery key. When a second peer opens the link, they find and replicate the core. Both peers see the same bracket, scores, and settlement state. No server coordinates this; the DHT handles peer discovery.

### Money Flow

| Step | What happens | Who holds the money |
|---|---|---|
| Create wallet | WDK generates a BIP39 seed, ethers derives an EVM address | User's localStorage |
| Fund wallet | Send Sepolia test USDt from a faucet to the address | On-chain (Sepolia) |
| Join tournament | Team commits to play (entry fee is known, on-chain debit planned for Phase 2) | Tournament pool (calculated) |
| Enter pot | Stake USDt on a match prediction | Pot pool (calculated) |
| Settle tournament | 50/30/20 split is computed from final bracket | Captains claim via wallet |
| Send USDt | Real `transfer()` on the Sepolia USDT contract | On-chain transaction |

---

## Quick Start

```bash
pnpm install
cp .env.example .env.local
# Add your DGRID_API_KEY to .env.local for AI features
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The World Cup 2026 bracket is pre-seeded.

### Environment

| Variable | Required | Description |
|---|---|---|
| `DGRID_API_KEY` | No | DGrid AI API key. AI shows a configuration notice if not set. |
| `SEPOLIA_RPC_URL` | No | Sepolia RPC endpoint. Defaults to `https://ethereum-sepolia-rpc.publicnode.com`. |

---

## Features

### Tournament System

- Create knockout tournaments (4 to 64 teams) with USDt entry fees
- Each tournament has a real Hypercore via Corestore — state snapshots appended on every mutation
- DHT announcement and replication (`@hyperswarm/dht`) for peer discovery
- Share `pear://` invite links with embedded Hypercore discovery keys
- Enter match scores via inline editor — bracket auto-advances winners through R16 → QF → SF → Final
- Settle tournament for automatic prize distribution (50/30/20 split)
- Settle gate requires the final match to be complete (no premature settlement)

### Prediction Pots

- Create pots on any pending match with real team names
- Players pick Team A, Draw, or Team B with a USDt stake
- Entries linked to the connected self-custodial wallet address
- Transparent pool: entries, total pool, potential payout per winner
- **Auto-settle when bracket result is entered** — pot outcome always matches match result, no manual admin step

### AI Assistant

- Works on any tournament (selector shows all loaded tournaments)
- Streaming match recaps via Server-Sent Events from DGrid (GPT-4o-mini)
- Context-aware: real team names, scores, round passed to the model
- Match predictions for upcoming fixtures with team form analysis
- Graceful degradation: shows configuration notice when API key is not set

### Self-Custodial Wallet

- Create wallet: BIP39 seed generation via WDK, real EVM address via ethers (`m/44'/60'/0'/0/0`)
- Import existing wallet from seed phrase
- **Live Sepolia USDt balance** queried from the on-chain USDT contract (`0xd077a4...`) using only the public address
- **Real Sepolia USDt send** via `transfer()` — seed only used for transaction signing
- Persistent across sessions (localStorage)
- Seed phrase reveal/hide with one tap

### Design

- Warm-tinted dark palette (`#0F1316` base)
- Hairline borders (`rgba(255,255,255,0.06)`) — FotMob/Polymarket convention
- Single saturated green accent (`#1AB943`) — football category standard
- Tricolor spine bar — World Cup 2026 host identity
- Tabular numerals everywhere — scores align perfectly
- Bottom nav: Home · Bracket · Pots · AI · Wallet
- Toast notifications (sonner), skeleton loaders, proper empty states

---

## Architecture

```
Next.js 16 (React 19 + TypeScript + Tailwind v4)
│
├── Frontend (App Router — client components)
│   ├── /                          Home — tournaments, pots, P2P peer status
│   ├── /tournament/create         Create knockout tournaments, pear:// + share links
│   ├── /tournament/[id]           Bracket, score entry, settle, P2P status pill
│   ├── /pot/create                Create prediction pots on matches
│   ├── /pot/[id]                  Enter picks (wallet-linked), auto-settled view
│   ├── /assistant                 DGrid AI: SSE streaming recaps and predictions
│   └── /wallet                    Self-custodial wallet, live balance, real send
│
├── API Routes (App Router — dynamic)
│   ├── /api/tournament            Hypercore-backed CRUD, bracket engine, peer info
│   ├── /api/pot                   Pot create/enter (auto-settles on match result)
│   ├── /api/ai                    DGrid AI streaming completions (SSE)
│   └── /api/wallet                Create/import/balance (address-based) /send (seed for signing)
│
└── Services (server-side only)
    ├── src/services/peers.ts        Corestore + DHT node, core lifecycle, replication
    ├── src/services/tournament.ts   Key gen, bracket engine, Hypercore persistence, pots
    └── src/services/wallet-service.ts WDK seed gen, ethers EVM derivation, Sepolia USDT
```

---

## Tracks Deep-Dive

### Pears (P2P)

| Component | Role |
|---|---|
| `sodium-javascript` | Real 32-byte Ed25519 key pairs for tournament identity |
| `corestore` | Manages one Hypercore per tournament on disk (RocksDB) |
| `hypercore` | Append-only JSON log — every bracket mutation is a signed entry |
| `@hyperswarm/dht` | DHT node: announces cores for peer discovery, handles replication connections |
| `pear://` links | Carry the real Hypercore discovery key — peers find and sync via DHT |

Flow: `createTournament` → `corestore.get(name)` → `core.append({created})` → `dht.announce(discoveryKey)` → peer connects → `core.replicate(socket)` → both peers in sync.

### WDK (Wallets)

| Component | Role |
|---|---|
| `@tetherto/wdk` | `getRandomSeedPhrase()` for BIP39 mnemonic generation |
| `ethers` | `HDNodeWallet.fromPhrase()` derives real EVM address via `m/44'/60'/0'/0/0` |
| `ethers.Contract` | Reads USDT balance from `0xd077a400968890eacc75cdc901f0356c943e4fdb` on Sepolia |
| `ethers.Contract.transfer()` | Real on-chain Sepolia USDt transfer (seed signs, address identifies) |

Security: Balance queries use the public address only. The seed is sent to the API only for `send` (transaction signing). Imported seeds are validated before use.

### AI (DGrid)

| Component | Role |
|---|---|
| DGrid API | Decentralized gateway to `openai/gpt-4o-mini` |
| SSE streaming | `stream: true` → `ReadableStream` → incremental client-side rendering |
| Context passing | Real team names, scores, tournament round sent as structured prompts |

---

## Tech Stack

- **Framework**: Next.js 16 / React 19 / TypeScript / Tailwind CSS v4
- **Fonts**: Geist + Geist Mono (next/font)
- **UI**: lucide-react (icons), sonner (toasts), motion (animations)
- **Pears**: hypercore, @hyperswarm/dht, corestore, autobase, hyperbee, sodium-javascript, b4a
- **WDK**: @tetherto/wdk, ethers
- **AI**: DGrid API (dgrid.ai) — SSE streaming
- **Persistence**: Corestore (Hypercore on disk), localStorage (wallet)

---

## Roadmap

### Phase 1 — Foundation (current)

What the first cut delivers: a credible end-to-end demo with every headline track genuinely wired.

- [x] Real Hypercore per tournament via Corestore with DHT announcement
- [x] `pear://` invite links with real discovery keys
- [x] WDK seed generation + ethers EVM address derivation
- [x] Live Sepolia USDt balance from on-chain contract (address-based queries)
- [x] Real Sepolia USDt send via `transfer()` with tx hash display
- [x] DGrid AI with SSE streaming, works on any tournament
- [x] Prediction pots auto-settle from bracket results (no admin override)
- [x] Bracket engine with auto-advancement and final-match settle gate
- [x] UI polish: tricolor spine, FotMob-style dark theme, skeleton loaders, toast notifications

### Phase 2 — Trust & Completeness

Close the gap between "demo" and "production-grade." Make the engine bulletproof and the money real.

- [ ] **On-chain settlement**: `settleTournament` triggers real Sepolia USDt transfers to team captains' wallet addresses. Prize money moves on-chain, not just in memory.
- [ ] **Bracket engine correctness**:
  - Bye handling for non-power-of-2 fields (teams get auto-walkovers)
  - Draw + penalties score editor (ties resolved via shootout, not defaulting to team A)
  - Podium rooted on the final match explicitly (`m.round === 'final'`), not last-completed
  - 3rd-place payout only when semifinals exist; refund otherwise
  - Idempotent settlement (reject double-settle)
- [ ] **Pot engine improvements**: deduplicate entries per address, distribute remainder dust to first winner instead of floor-truncating
- [ ] **API validation**: Zod schemas on all create/join/result/settle payloads — reject oversized or malformed inputs before they touch the engine
- [ ] **Engine test suite**: vitest coverage of the bracket engine (byes, draws, out-of-order entry, premature settle rejection)
- [ ] **Shared components extraction**: `src/components/` with `MatchCard`, `roundLabel`, `roundOrder` — kill the 3x duplication across pages

### Phase 3 — Differentiation & Polish

Turn a solid entry into a winning one. Add a "wow" moment the judges haven't seen.

- [ ] **Serverless P2P demo**: `pear://` deep-link opens in a Pear Runtime app and replicates tournament state with zero server involvement. Two Pear instances on separate machines find each other via DHT and stay in sync.
- [ ] **Hyperbee persistence**: Replace in-memory `Map`s with Hyperbee keyed by tournament/pot ID. State survives server restarts.
- [ ] **On-device QVAC AI (stretch)**: Run match recaps on-device via QVAC SDK — no cloud, no API key, data never leaves the machine. Wins the QVAC track if time permits.
- [ ] **Full demo video re-record**: capture every Phase 2–3 improvement on camera
- [ ] **README polish**: update all docs to reflect final submission state

## License

Apache-2.0
