# TICKET-004 - Future: Categories Management

**Type:** Feature  
**Priority:** Medium  
**Status:** ⏳ Future  
**Related:** TICKET-002, TICKET-003  
**Sprint:** Post-MVP  

## Description
Improve category management to be fully user-configurable, reusable from transaction/transfer flows and aligned with mobile UX.

## Requirements
- [ ] Create a "Categorías" section/screen to list current categories
- [ ] Allow adding new categories
- [ ] Allow editing existing categories (name, icon, color/type)
- [ ] Allow deleting categories with validation (check if in use by transactions/transfers)
- [ ] When creating a transaction or a transfer, allow creating a category from that flow without leaving it
- [ ] Share the same category creation/edit modal between the categories section and the transaction/transfer creation flows
- [ ] Persist categories in Firestore per user (`categories/{categoryId}` with `ownerId`) with sensible defaults for new users
- [ ] Update category pickers to include user categories
- [ ] Add tests for category CRUD and usage checks

## Technical Notes
- Start from current fixed categories but migrate to dynamic model
- Avoid hardcoding category lists in forms after migration
- Keep backward compatibility for existing transactions
- Consider soft delete or block deletion if category is used
- Keep modal reusable (shared component) to avoid duplication
