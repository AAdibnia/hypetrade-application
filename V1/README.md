# HypeTrade — V1 (API‑ready Client)

HypeTrade helps retail traders cut through market hype by documenting the why behind trades, analyzing patterns, and building disciplined strategies.

## Features (MVP)

- **Authentication**: Login/Signup with email and password validation
- **Portfolio Dashboard**: Real-time portfolio tracking with cash balance, portfolio value, and P&L
- **Position Management**: View all holdings with buy/sell positions
- **Trading Interface**: Buy and sell stocks with quantity selection
- **Journal System**: Document trade rationale and information sources (attached to specific trades)
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Simulated price updates every minute

## Getting Started (V1)

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the V1 directory:
```bash
cd V1
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

Optional: live search via RapidAPI (Yahoo Finance)

Create `V1/.env`:

```
REACT_APP_RAPIDAPI_KEY=YOUR_KEY
```

Restart `npm start`.

Optional: API mode (future server integration)
```
# Defaults to local mock adapter if omitted
REACT_APP_API_MODE=local
```

## Usage

### Authentication
- Use any valid email format for login/signup
- Password must be at least 8 characters
- New users receive $100,000 virtual balance

### Trading
- Click "New Trade" to buy stocks (live search + offline fallback)
- Use "Sell" button on positions to sell shares
- After buy or sell, a journal modal collects your rationale and sources

### Portfolio
- View real-time portfolio value and P&L
- See all positions with current market prices
- Access trade history and journal entries

## Technology Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **Lucide React** for icons
- **Create React App** for build tooling
  - API abstraction via context/provider and adapters

## Project Structure

```
V1/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   ├── LoginForm.tsx
│   │   ├── SignUpForm.tsx
│   │   └── Dashboard.tsx
│   ├── api/              # API layer (contracts + local adapter + provider)
│   │   ├── client.tsx
│   │   ├── contracts.ts
│   │   └── local.ts
│   ├── lib/
│   │   └── utils.ts      # Utility functions
│   ├── App.tsx           # Main app component
│   ├── index.tsx         # App entry point
│   └── index.css         # Global styles
├── package.json
├── tailwind.config.js
└── README.md
```

## Architecture (V1)

- API contracts in `src/api/contracts.ts`
- Adapters (ports/adapters pattern):
  - `LocalApi` in `src/api/local.ts` (uses `localStorage` for persistence)
  - `Quotes` adapter calls RapidAPI if `REACT_APP_RAPIDAPI_KEY` is set, otherwise falls back to a local curated list
- Provider and hook in `src/api/client.tsx`:
  - Wraps the app and exposes a stable API surface for UI components
- No server required today; when a backend exists, add an `HttpApi` adapter and switch via `REACT_APP_API_MODE`

## Differences vs `MVP/`

- UI workflow is the same; code now calls a stable API layer instead of touching storage directly
- Easier future migration to a real backend without UI rewrites
- Positions view (V1-only): Sell rows are grouped under their originating buy lot, newest-first, with a Remaining shares indicator on the buy row (applies to mobile and desktop)
- Login (V1-only): "Remember me" option persists your session on this device
- Journal (V1-only): Skip option removed; journal entry required after buy/sell

## Product Framing (PM Showcase)

- Problem: retail traders chase hype and skip process; no feedback loop
- Users: early-stage retail; goals: structure, self-awareness, discipline
- Non-goals: brokerage integration, complex analytics (for MVP)
- Success: % trades with journal, # journaled trades, retention delta

## Development

The app is built with a modular component structure:

- **App.tsx**: Main application with authentication flow
- **Dashboard.tsx**: Portfolio management and trading interface
- **LoginForm.tsx**: User authentication
- **SignUpForm.tsx**: User registration

Additionally for V1:
- **api/contracts.ts**: typed API contracts
- **api/local.ts**: local implementation (no server)
- **api/client.tsx**: provider + `useApi()` hook

## Mock Data

The app currently uses mock stock data for demonstration:
- AAPL, GOOGL, MSFT, TSLA, AMZN, NVDA
- Simulated price updates every minute
- Virtual trading environment

## Roadmap (Next)

- History filters/search; row detail modal with journal
- Secure proxy for quotes; throttling & caching
- Dedicated Journal page; templates/tags
- Mobile polish & accessibility
- Optional backend; real auth; analytics
