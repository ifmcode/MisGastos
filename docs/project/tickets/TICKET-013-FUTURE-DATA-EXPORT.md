# TICKET-013 - Future: Data Export

**Type:** Feature  
**Priority:** Low  
**Status:** ⏳ Pending  
**Related:** PM-012; TICKET-002, TICKET-003, TICKET-006, TICKET-053, TICKET-054  
**Sprint:** Post-V1 / Phase 9

## Description
Allow users to export their account data to a canonical, versioned JSON snapshot, either for the whole account or for one wallet. The JSON snapshot is the portable format that the import (TICKET-053) and the Google Drive backup (TICKET-054) consume. CSV and PDF are deliberately deferred until a real readability need appears. Shared and group data is never exported.

## Requirements
### Account data scope
- [ ] Cover wallets, movements (expenses and incomes), transfers, categories and account settings (preferred currency, language, theme preference and include-in-total defaults) and nothing else
- [ ] Offer a wallet scope selector: one wallet or all wallets, with **all wallets** as the default for a full export
- [ ] Include a transfer when either side matches the selected wallet, showing both wallet names, origin and destination; the **all wallets** scope includes every active and archived wallet
- [ ] Export each wallet's metadata: name, type, currency, `includeInTotal`, current balance and `archivedAt`
- [ ] Exclude shared expenses, settlements, groups, friends and every other user's data explicitly and by design, even when a movement is linked to a shared expense
- [ ] Document the exclusions in the user copy so the export is never mistaken for a full account backup

### Portable format
- [ ] Emit a versioned JSON snapshot with `formatVersion`, `exportedAt`, `appVersion` and one array per collection (wallets, movements, transfers, categories, settings), documented in `docs/project/`
- [ ] Keep the snapshot schema stable and validated by a pure module, so TICKET-053 and TICKET-054 consume it instead of inventing a second format
- [ ] Include every exported record with its own fields, so the file is self-contained: movements with date, type, concept, category, wallet, amount and currency; transfers with origin, destination, amount, date and notes
- [ ] Keep CSV and PDF out of the first version; add them later only if a real readability need appears

### Delivery
- [ ] Let the user choose the wallet scope (one or all) and an optional date range, and export the resulting snapshot
- [ ] Share or save the generated file through the platform share sheet
- [ ] Use a clear file name that includes the account, the scope and the date range
- [ ] Handle large datasets without blocking the UI
- [ ] Add tests for the JSON snapshot serialization and validation, including money and currency round-trips

## Acceptance Criteria
- [ ] Selecting one wallet exports only that wallet's movements and the transfers that touch it, and the file never contains another wallet's records
- [ ] The **all wallets** scope includes every active and archived wallet, all movements, all transfers, all categories and the account settings
- [ ] The JSON snapshot validates against the documented schema and exposes `formatVersion`, `exportedAt` and `appVersion`
- [ ] Shared expenses, settlements, groups and friends never appear in any output, for any scope
- [ ] A user can export a date range and open the file
- [ ] Exported totals and rows match the on-screen data
- [ ] The output is a single JSON file; no CSV or PDF is generated in this version
- [ ] Concepts and notes with quotes, line breaks and non-ASCII characters survive a serialize/parse round-trip
- [ ] Empty ranges produce a clear message instead of an empty file
- [ ] No data from other users is included
- [ ] Export works on mobile and web, or the unsupported platform is clearly handled

## Technical Notes
- **Canonical snapshot:** JSON is the only output of this version. The serializer and the validator are pure modules with colocated tests, versioned by `formatVersion`, and their contract is documented in `docs/project/` so the export, the import (TICKET-053) and the Drive backup (TICKET-054) cannot drift.
- **CSV and PDF are deferred:** they are not part of V1. If they are added later, they are derived from the same snapshot with a pure serializer (CSV first, `expo-print` for PDF) and never become a second source of truth.
- **Shared and group data are out by design:** the snapshot is an account-owned export. A movement linked to a shared expense keeps its own amount and category but never carries the shared-expense, group or settlement document or the counterpart's data.
- **Balances are informational:** wallet balances are derived from the stored movements/transfers and exported as a convenience. Import must recompute them and never trust the exported value.
- Use `expo-file-system` and `expo-sharing` for the mobile share flow, with a web fallback.
- Do not add a backend for this feature. Generate the file locally from the already-loaded data or paginated queries.
- Be careful with mixed currencies; the snapshot keeps the currency per wallet and per movement, with no conversion.
- Decision record: `docs/project/development-notes/session-notes/2026-11-17-account-portability-and-notifications.md`.

## Validation Plan
- Export one wallet with movements on both sides of a transfer and confirm only that wallet's movements and the matching transfers appear, with both wallet names.
- Export the whole account and confirm wallets (active and archived), movements, transfers, categories and settings are present.
- Validate the JSON snapshot against the documented schema and confirm an incompatible `formatVersion` is rejected by the shared validator.
- Create a shared expense with a linked movement and confirm the export contains no shared-expense, settlements, group or friend data.
- Check a concept and a note with quotes, line breaks and non-ASCII characters and confirm the JSON round-trip preserves them.
- Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.

## Dependencies
- TICKET-002 Transactions
- TICKET-003 Transfers and Dashboard
- TICKET-006 Profile and preferred currency (account settings in the snapshot)
- TICKET-053 account data import (consumes the snapshot)
- TICKET-054 Google Drive backup (stores the same snapshot)
