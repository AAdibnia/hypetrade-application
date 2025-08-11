# HypeTrad — Product Manager Showcase

[![CI](https://github.com/AAdibnia/hypetrad-mvp/actions/workflows/ci.yml/badge.svg)](https://github.com/AAdibnia/hypetrad-mvp/actions/workflows/ci.yml)

HypeTrad helps retail traders cut through market hype by documenting the why behind decisions, analyzing patterns, and building disciplined strategies.

## Repository Structure
- `MVP/` — Web MVP (React + TypeScript + Tailwind)
- `Prototype/` — Early prototype UI and styles
- `Road-Maps/` — Goals, epics, roadmaps, and boards
- `docs/` — PM docs (Decisions, Roadmap, Metrics)

## Why this is a strong PM showcase
- Clear MVP scope focused on journaling discipline and repeatable decisions
- Thoughtful trade-offs (local‑only MVP, per‑purchase rows, journals per trade)
- Documented roadmap and success metrics
- Clean UX flows (buy → journal, sell → journal, history)

## MVP Highlights
- Authentication (mock, device‑local persistence)
- Dashboard: cash, portfolio value, P&L, allocation donut
- Positions per purchase; sells add negative rows; original buy remains
- Buy (New Trade modal) and Sell (modal), both followed by Journal
- Trade History with empty state; theme‑consistent UI
- Live search via RapidAPI with offline fallback + throttling (MVP)
- Reset button to return account to initial state for demos

## Quickstart (Local)
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
- Decisions: `docs/Decisions.md`
- Roadmap: `docs/Roadmap.md`
- Metrics: `docs/Metrics.md`
- MVP Technical README: `MVP/README.md`

## Next Steps
- History filters/search + row detail modal (journal)
- Secure proxy for quotes + stronger throttling/caching
- Notes/Journal page; templates/tags; search & browse
- Mobile & accessibility polish (focus traps, Esc, ARIA)
- Optional backend for auth & analytics

## License
MIT (or your choice)
