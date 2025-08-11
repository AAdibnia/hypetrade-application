# Success Metrics (MVP)

## North Star
- % of trades with journal entries

## Supporting metrics
- # journaled trades per active user (7/30 day)
- Retention uplift among users who journal vs. those who don’t
- Time to first journal (activation)
- Error‑free sell flow (% sells with journal saved)

## Events (future backend)
- trade_executed { action, ticker, quantity, price }
- journal_saved { action, sources[], length, time_to_journal }
- reset_account { time_since_signup }

## Targets (initial)
- >70% of trades have a journal entry in demo sessions
- <2 minutes median time to first journal

