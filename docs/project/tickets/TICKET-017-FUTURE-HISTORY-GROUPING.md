# TICKET-017 - Future: History Grouped by Day/Month

**Type:** Improvement  
**Priority:** Low  
**Status:** ⏳ Pending  
**Related:** PM-017; TICKET-002, TICKET-015  
**Sprint:** Post-MVP  

## Description
Group the transaction history by day or month with section headers and period totals, making long histories easier to scan.

## Requirements
- [ ] Group transactions by day by default
- [ ] Allow switching between day and month grouping
- [ ] Show a header with the period label and net total
- [ ] Keep the existing wallet, type, category, date and text filters
- [ ] Keep ascending/descending sort behaviour
- [ ] Handle empty groups and empty filtered results
- [ ] Keep the list performant with a large number of transactions
- [ ] Add tests for grouping, ordering and period totals

## Acceptance Criteria
- [ ] Transactions appear under the correct day or month
- [ ] Each header shows the correct total for its period
- [ ] Changing filters or sorting re-groups the list correctly
- [ ] The list does not render nested virtualized lists
- [ ] The empty state still appears when no transaction matches
- [ ] Day/month labels respect the app language

## Technical Notes
- Extract the transformation into a pure util, for example `groupTransactionsByPeriod(transactions, mode)`.
- Use `SectionList` or a FlatList with explicit header items. Do not nest a FlatList inside a ScrollView.
- Money totals per group must respect the transaction currency. If mixed currencies are possible, show separate totals or the currency breakdown.
- Coordinate with TICKET-015 so the text filter feeds the same grouped data.

## Dependencies
- TICKET-002 Transactions and history
- TICKET-015 Advanced Search (optional, for combined filters)
