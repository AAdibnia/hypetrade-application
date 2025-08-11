# Roadmap (MVP → v1)

## Goals
- Validate journaling habit during buy/sell
- Enable simple review via History
- Keep scope small; ship quickly; measure usefulness

## Near‑term (v1.1)
1) History enhancements
   - Search (ticker), filters (buy/sell, date range)
   - Row detail modal (includes journal)
   - Acceptance: user can find trades quickly; journal visible in detail
2) Quotes/Proxy hardening
   - Tiny proxy to hide API key; throttle & cache server‑side
   - Acceptance: no 403/429 in normal demo; key not exposed in client

## Mid‑term (v1.2)
3) Journal/Notes page
   - Browse, search, tag journal entries; simple templates
   - Acceptance: user can find patterns across journals
4) Mobile & accessibility polish
   - Focus traps, Esc close, ARIA labels; header controls on small screens
   - Acceptance: keyboard‑only usage works; passes basic a11y checks

## Longer‑term (v1.3+)
5) Backend & analytics
   - Real auth; multi‑device sync; event tracking
   - Acceptance: basic dashboards for key KPIs

## Risks & mitigations
- API limits → throttling, caching, offline fallback
- Local‑only persistence → clear messaging; backend later
- Scope creep → keep non‑goals visible in README/docs

