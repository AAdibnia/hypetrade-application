# HypeTrad — Product Manager Showcase

[![CI](https://github.com/AAdibnia/hypetrad-mvp/actions/workflows/ci.yml/badge.svg)](https://github.com/AAdibnia/hypetrad-mvp/actions/workflows/ci.yml)

HypeTrad helps retail traders cut through market hype by documenting the why behind trades, analyzing patterns, and building disciplined strategies.

## Table of Contents
- [Repository Structure](#repository-structure)
- [Why This Is a Strong PM Showcase](#why-this-is-a-strong-pm-showcase)
- [MVP Highlights](#mvp-highlights)
- [Quickstart](#quickstart)
- [Docs](#docs)
- [Roadmap (Next)](#roadmap-next)
- [Architecture in Brief](#architecture-in-brief)
- [License](#license)

## Repository Structure
- `MVP/` — Web MVP (React + TypeScript + Tailwind)
- `Prototype/` — Early prototype UI and styles
- `Road-Maps/` — Goals, epics, roadmaps, and boards

## Why This Is a Strong PM Showcase
- Clear MVP scope focused on journaling discipline and repeatable decisions
- Thoughtful trade-offs (local‑only MVP, per‑purchase rows, journals per trade)
- Documented roadmap and success metrics with acceptance criteria
- Clean end‑to‑end flows (buy → journal, sell → journal, history) and reset for demos

## MVP Highlights
- Authentication (mock, device‑local persistence)
- Dashboard: Cash, Portfolio Value, P&L, Allocation Donut
- Positions per purchase; sells add negative rows; original buy remains
- Buy (New Trade modal) and Sell (modal) both followed by Journal entry
- Trade History with empty state; theme‑consistent UI
- Live search via RapidAPI with offline fallback + throttling (MVP)
- Reset button to return account to initial state for demos

## Quickstart
```bash
cd MVP
npm install
npm start
```
Optional live search (RapidAPI):
```
# MVP/.env
REACT_APP_RAPIDAPI_KEY=YOUR_KEY
```
Then restart `npm start`.

## Docs
- [Roadmap](Road-Maps/HypeTrade_ Product Roadmap.pdf)
- [Epics & User Stories](Road-Maps/Epics-User_stories-Acceptance_criteria.pdf)
- [Prototype](Prototype/README.md)
- [MVP Technical Details](MVP/README.md)
- [HypeTrade — GTM Strategy & Metrics](HypeTrade-%20GTM%20Strategy%20%26%20Metrics.pdf)
- [HypeTrade — User Research & Competitive Analysis](HypeTrade-User-Research-and-Competitive-Analysis.pdf)

## Roadmap (Next)
- History filters/search + row detail modal (journal)
- Secure proxy for quotes + stronger throttling/caching
- Notes/Journal page; templates/tags; search & browse
- Mobile & accessibility polish (focus traps, Esc, ARIA)
- Optional backend for auth & analytics

## Architecture in Brief
- Client‑only MVP (React + TypeScript + Tailwind)
- `App.tsx` owns global state (user, positions, trades, stocks); components are presentational
- Persistence per email in localStorage; immediate writes on buy/sell/journal/reset
- Prices update every minute (random walk); fallback to last trade price or purchase price

## License
MIT — see `LICENSE` in the repo root.
