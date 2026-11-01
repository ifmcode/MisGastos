# TICKET-004 - Future: Categories Management

**Type:** Feature  
**Priority:** Medium  
**Status:** ✅ Done  
**Related:** TICKET-002, TICKET-003  
**Sprint:** Post-MVP  

## Description
Improve category management to be fully user-configurable, reusable from transaction/transfer flows and aligned with mobile UX.

## Requirements
- [x] Create a "Categorías" section/screen to list current categories
- [x] Allow adding new categories
- [x] Allow editing existing categories (name, icon, color/type)
- [x] Allow deleting categories with validation (blocked while used by transactions; transfers remain uncategorized)
- [x] When creating a transaction, allow creating a category from that flow without leaving it
- [x] Share the same category creation/edit modal between the categories section and the transaction creation flow
- [x] Persist categories in Firestore per user (`categories/{categoryId}` with `ownerId`) with sensible defaults for new users
- [x] Update category pickers to include user categories
- [x] Add tests for category CRUD and usage checks

## Technical Notes
- Start from current fixed categories but migrate to dynamic model
- Avoid hardcoding category lists in forms after migration
- Keep backward compatibility for existing transactions
- Consider soft delete or block deletion if category is used
- Keep modal reusable (shared component) to avoid duplication

## Implementation Notes
- Categories live in the root `categories` collection and are scoped by `ownerId`.
- Defaults are seeded lazily when an owner has zero categories. Deterministic ids
  (`${ownerId}__${legacyId}`) keep seeding idempotent. Consequence: deleting the
  last category re-seeds the defaults on the next load.
- Deletion is a hard delete and is blocked when any transaction uses the
  category. Checks match both the document id and the legacy id.
- Existing transactions are not rewritten: seeded defaults keep their old ids in
  `legacyId` and pickers/filters resolve either value.
- Categories can be created from the transaction form through the shared modal;
  the new category is selected automatically. Transfers intentionally remain
  uncategorized (separate ticket decision).
- Category `type` is locked after creation in the UI, service and Firestore rules.
- Firestore rules for the `categories` collection still need to be deployed.
