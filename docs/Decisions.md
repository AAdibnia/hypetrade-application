# Key Decisions & Trade‑offs (MVP)

This document captures the most important product and technical decisions made for the MVP, why we chose them, and the implications.

---
## 1) Local‑only MVP (no backend)
- **Context**: Need a fast, demo‑ready product to validate journaling UX and flows.
- **Options considered**:
  1. Build a backend (auth, persistence, quotes)
  2. Local‑only (device‑scoped persistence)
- **Decision**: Local‑only MVP using  keyed by email
- **Rationale**:
  - Ship quickly; zero DevOps
  - Clear demo story without backend complexity
  - Enables offline demos when needed
- **Implications**:
  - Single‑device persistence only (OK for MVP)
  - Future backend can swap in without changing UI (clean state ownership)

---
## 2) Journals attach to specific trades
- **Context**: We want to train the process behind each buy/sell, not just a position.
- **Decision**: Journal entries are stored under a  (buy or sell), resolved from a  via .
- **Rationale**: Forces a habit: record reasoning when you act.
- **Implications**:
  - Each trade can have a different rationale (e.g., buy vs. sell)
  - History can surface both action and thinking

---
## 3) Per‑purchase positions
- **Context**: Aggregating positions hides cost basis and reasoning by lot.
- **Decision**: Each buy is its own row; sells add negative rows. Original buy remains.
- **Rationale**: Preserves context per lot; matches journaling design.
- **Implications**:
  - Clear P&L per purchase; easier audits and reviews
  - Sell button disabled when no lot shares remain

---
## 4) Centralized state in 
- **Context**: Early MVP, small codebase; avoid scattered state and side effects.
- **Decision**:  owns , , , ; components get props/callbacks.
- **Rationale**: Predictable data flow, easier persistence and journaling
- **Implications**:
  - One persistence path; no duplication
  - Swappable persistence (backend later) without UI churn

---
## 5) Live search via RapidAPI with graceful fallback
- **Context**: Users expect quick symbol discovery; API rate limits are real.
- **Decision**: Use Yahoo Finance via RapidAPI with debounce, caching, and offline fallback list.
- **Rationale**: Demo‑ready search with resilience when 403/429 occurs
- **Implications**:
  - When blocked, still returns common tickers locally; communicates limits transparently

---
## 6) Reset control for demoability
- **Context**: PM demos require quick state resets.
- **Decision**: Prominent red “Reset” button (left of logo) with confirmation modal
- **Rationale**: Enables repeatable demos; shows attention to demo UX
- **Implications**:
  - Resets cash to k; clears positions/trades/journals; keeps user logged in

---
## 7) Scope & theme guardrails
- **Decision**: No sidebar; cards → positions table layout; sticky header; consistent theme across pages
- **Rationale**: Keep focus on journaling and clarity over breadth of features
- **Implications**:
  - Faster shipping; cohesive look‑and‑feel

