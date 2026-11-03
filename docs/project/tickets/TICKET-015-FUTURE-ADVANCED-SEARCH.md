# TICKET-015 - Future: Advanced Search

**Type:** Feature  
**Priority:** Medium  
**Status:** ⏳ Pending  
**Related:** PM-014; TICKET-002  
**Sprint:** Post-MVP  

## Description
Extend the current transaction filters with free-text concept search and richer combined filtering while keeping the existing wallet, type, category, date and sort options.

## Requirements
- [ ] Add a text search field for concept and notes
- [ ] Match case-insensitively and ignore common accents
- [ ] Combine text search with wallet, type, category and date filters
- [ ] Optionally add an amount range filter
- [ ] Show the number of active filters and a clear-all action
- [ ] Preserve the selected sort order
- [ ] Add a specific no-results state
- [ ] Add tests for text matching, combined filters and empty queries

## Acceptance Criteria
- [ ] Searching "cena" finds concepts containing "Cena" and "céna"
- [ ] Clearing the search restores the previous filtered list
- [ ] Text search works together with every existing filter
- [ ] Empty input does not filter out any transaction
- [ ] The filter panel remains usable on small screens
- [ ] Filtering stays responsive with the current dataset

## Technical Notes
- Keep filtering client-side for now; the existing `features/transactions/utils/transaction-filters.ts` already centralises the logic.
- Add a pure `matchesText` helper and reuse it from the filter function. Normalise with `toLocaleLowerCase` and Unicode diacritic removal.
- Debounce the input in the UI, not in the pure filter function.
- If the dataset later requires server-side search, add Firestore queries and indexes in a separate ticket.

## Dependencies
- TICKET-002 Transactions and history
