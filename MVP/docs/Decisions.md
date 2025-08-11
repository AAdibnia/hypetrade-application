# Key Decisions & Trade-offs

- Local-only MVP: ship UX fast; avoid backend until validated. Persist per-email in localStorage.
- Journals per trade: attach reasoning to each buy/sell; positions resolve via positionId.
- Per-purchase positions: each buy is its own row; sells add negative rows, original buy remains.
- RapidAPI fallback: live search (Yahoo) with offline fallback list; debounce/limit to avoid 429s.
- Centralized state: single owner in App; components are presentational with callbacks.
