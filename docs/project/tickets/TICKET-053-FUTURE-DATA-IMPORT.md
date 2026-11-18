# TICKET-053 - Account Data Import

**Type:** Feature  
**Priority:** Low  
**Status:** ⏳ Pending  
**Related:** TICKET-013, TICKET-054  
**Sprint:** Post-V1

## Description
Let a signed-in user restore an account from a snapshot produced by the export (TICKET-013): wallets, movements, transfers, categories and account settings. Import is additive and explicit — nothing is written before the file is validated and the user confirms a preflight summary — and missing wallets or categories can be created or renamed on the way in. Shared, group and other users' data is never imported.

## Requirements
### Reading and validating
- [ ] Let the user pick a JSON snapshot produced by TICKET-013 (share sheet, file picker or Drive restore from TICKET-054)
- [ ] Validate `formatVersion`, the documented schema and the internal integrity (unique ids, wallet references, transfer and movement currency consistency, valid money values) before writing anything
- [ ] Reject a newer or unsupported `formatVersion`, an unknown top-level shape and malformed money with a translated error code, and never partially write on validation failure
- [ ] Keep the parser and the validator pure modules with colocated tests, reusing the TICKET-013 contract instead of a second format
- [ ] Keep the reading layer behind a source seam (the TICKET-013 snapshot being the first source), so a future adapter for another app does not change the validation or write pipeline

### Preflight and confirmation
- [ ] Show a preflight summary before any write: wallets, categories, movements, transfers, skipped items and conflicts, with counts the user can compare against the file
- [ ] Require an explicit confirmation before writing; a cancelled preflight writes nothing
- [ ] Ask before creating a missing wallet or category, with an editable name step for each imported wallet and category so it can be renamed before it is created
- [ ] Resolve collisions by explicit choice (reuse the existing record, rename on import or skip the item) for both same-name and same-id cases, and never merge silently

### Writing
- [ ] Assign every imported record to the current signed-in owner, ignoring any owner field in the file
- [ ] Never import shared expenses, settlements, groups, friends or any other user's data, even when the snapshot contains such entries
- [ ] Recompute wallet balances from the imported movements and transfers and compare them with the snapshot, warning on a mismatch and never overwriting a balance silently
- [ ] Make the import idempotent through the origin ids or an import id, so importing the same snapshot twice does not duplicate records
- [ ] Batch the writes, report partial failures with the affected counts and keep the already-written records consistent
- [ ] Never offer a destructive "replace account" action in this ticket
- [ ] Keep loading, progress, error and success states, es/en copy, dark mode and accessibility, and pass `npm run check:copy`
- [ ] Add colocated tests for a version mismatch, unknown fields, duplicate names, invalid money and a partial failure

## Acceptance Criteria
- [ ] A valid snapshot imports the wallets, categories, movements, transfers and settings, and the recomputed totals match the snapshot
- [ ] A movement that references a missing wallet or category is offered for creation with an editable name, and skipping it removes the record from the imported counts
- [ ] A duplicate (same name or same id) is resolved by reuse, rename or skip without losing data
- [ ] An invalid file or a newer `formatVersion` is rejected with a translated code and nothing is written
- [ ] Shared, group and friend data and any other user's data never appear after an import
- [ ] Importing the same snapshot twice leaves the same record count
- [ ] A partial failure reports the affected records and leaves the account consistent
- [ ] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Technical Notes
- **One contract, two directions:** the parser/validator is the same module family as the TICKET-013 serializer, versioned by `formatVersion`. A snapshot the export refuses to produce must be rejected on import, and the contract lives in `docs/project/` so both tickets and TICKET-054 cannot drift.
- **Integer cents at the boundary:** the file stores integer cents; decimals appear only at the transactions boundary, exactly like the rest of the project. Mixed currencies are imported per record, never converted.
- **Balances are derived, not trusted:** the snapshot balance is compared against the recomputed value and mismatches are reported as a warning, because the movements and transfers are the source of truth.
- **Idempotency:** prefer the origin document ids when they are free; otherwise record an import id and map origin ids to the created ones, so a retry updates instead of duplicating.
- **Firestore limits:** `runTransaction` and `writeBatch` cap the number of operations per commit, so the import chunks its writes and reports per chunk; a failure never leaves a wallet without its movements.
- **No backend:** the file is parsed and written on the device through the existing repositories and rules; no Cloud Function and no server-side staging.
- **Possible second source, not specified yet:** the first version consumes only the TICKET-013 snapshot. Importing from another expense-manager app is a real goal, but its file shape, column/field mapping and conflict rules must be researched and defined with that app in hand; the source seam above exists so that work adds an adapter instead of rewriting the pipeline. The idempotency/id strategy (origin ids vs an import log) is deferred until that source is known.
- Decision record: `docs/project/development-notes/session-notes/2026-11-17-account-portability-and-notifications.md`.

## Validation Plan
- Export a full account, delete some records, import the snapshot and confirm the wallets, categories, movements, transfers and settings are restored with matching totals.
- Import a snapshot with a movement pointing at a missing wallet and category, rename them in the preflight and confirm the records land on the new names.
- Import a snapshot whose wallet name already exists and repeat with a colliding id; resolve as reuse, rename and skip and confirm no data loss in each case.
- Import a newer `formatVersion`, a truncated file and a file with invalid money; confirm each is rejected with a translated code and no write.
- Add shared, group and friend entries to the fixture and confirm they never appear after the import.
- Import the same snapshot twice and confirm the record count does not change; force a partial failure and confirm the report and the consistency.
- Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.

## Dependencies
- TICKET-013 account data export (produces the versioned JSON snapshot and its contract)
- TICKET-054 Google Drive backup (its restore path reuses this import pipeline)
