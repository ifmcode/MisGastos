# TICKET-013 - Future: Data Export

**Type:** Feature  
**Priority:** Low  
**Status:** ⏳ Pending  
**Related:** PM-012; TICKET-002, TICKET-003  
**Sprint:** Post-MVP  

## Description
Allow users to export their financial data to CSV or PDF, either completely or using the current filters and date range.

## Requirements
- [ ] Export transactions with date, type, concept, category, wallet, amount and currency
- [ ] Export transfers with source wallet, destination wallet, amount, date and notes
- [ ] Support exporting all data or the current filtered range
- [ ] Let the user choose CSV or PDF if both are implemented
- [ ] Share or save the generated file through the platform share sheet
- [ ] Use a clear file name that includes the date range
- [ ] Handle large datasets without blocking the UI
- [ ] Add tests for the CSV serialization and escaping rules

## Acceptance Criteria
- [ ] A user can export a date range and open the file
- [ ] Exported totals and rows match the on-screen data
- [ ] Special characters, commas and line breaks are escaped correctly
- [ ] Empty ranges produce a clear message instead of an empty file
- [ ] No data from other users is included
- [ ] Export works on mobile and web, or the unsupported platform is clearly handled

## Technical Notes
- Implement CSV first with a pure serializer; PDF can follow using `expo-print` if the product requires it.
- Use `expo-file-system` and `expo-sharing` for the mobile share flow, with a web fallback.
- Do not add a backend for this feature. Generate files locally from the already-loaded data or paginated queries.
- Include a header row and a stable column order. Document the format in `docs/project/`.
- Be careful with mixed currencies; either export the currency column or separate files per currency.

## Dependencies
- TICKET-002 Transactions
- TICKET-003 Transfers and Dashboard
