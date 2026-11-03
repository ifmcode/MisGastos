# TICKET-016 - Future: Statistics and Charts

**Type:** Feature  
**Priority:** Medium  
**Status:** ⏳ Pending  
**Related:** PM-016; TICKET-002, TICKET-003, TICKET-006  
**Sprint:** Post-MVP  

## Description
Add a statistics view with income vs expense totals, category breakdown and a monthly trend so users can understand their spending beyond the dashboard summary.

## Requirements
- [ ] Add a statistics screen or section reachable from the dashboard
- [ ] Provide date-range presets (current month, last month, last 3 months, custom)
- [ ] Filter by wallet, or show all wallets
- [ ] Show total income, total expense and net result for the range
- [ ] Show an expense breakdown by category
- [ ] Show a monthly income/expense trend
- [ ] Handle wallets and groups with different currencies without mixing totals
- [ ] Add loading, empty and error states
- [ ] Add tests for aggregation, date ranges and currency grouping

## Acceptance Criteria
- [ ] Totals match the transactions shown by the existing filters
- [ ] Category percentages add up to 100% (allowing for rounding)
- [ ] Changing the range or wallet updates every chart
- [ ] Empty ranges show a clear empty state
- [ ] Charts are readable in light and dark mode
- [ ] The screen does not block on a heavy chart library

## Technical Notes
- Keep aggregation pure and tested: `totalsByType`, `totalsByCategory`, `totalsByMonth`.
- Evaluate a chart library compatible with the current Expo SDK and web before adding a dependency. A simple bar/line representation with `react-native-svg` may be enough.
- Do not convert currencies. Group totals by currency or let the user select one currency.
- Reuse `useTransactions` and the existing money/date utilities instead of adding parallel data fetching.

## Dependencies
- TICKET-002 Transactions
- TICKET-003 Dashboard
