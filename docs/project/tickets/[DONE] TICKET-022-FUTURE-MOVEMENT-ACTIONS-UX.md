# [DONE] TICKET-022 - Future: Discoverable Edit/Delete Actions for Movements

**Type:** Improvement  
**Priority:** Medium  
**Status:** ✅ Done (08/11/2026)
**Related:** PM-022; TICKET-002, TICKET-003  
**Sprint:** Post-MVP  

## Description
The app already supports editing and deleting expenses, incomes and transfers, but the action is hidden behind tapping a card. Make the action discoverable, accessible and consistent across both lists.

## Requirements
- [x] Replace `onTouchEnd` with a real `Pressable` in `TransactionItem` and `TransferItem`
- [x] Add pressed feedback and an accessibility role, label and hint
- [x] Add a visible edit affordance (chevron, pencil icon or action menu)
- [x] Keep delete inside the edit form with confirmation, or add an explicit delete action in the menu
- [x] Ensure both lists open the edit modal with the correct item
- [x] Preserve balance updates and soft-delete behaviour
- [x] Add tests or manual checks for item press and the delete confirmation flow

## Acceptance Criteria
- [x] Users can tell that a movement or transfer can be edited
- [x] Tapping a card reliably opens the edit form on iOS, Android and web
- [x] Screen readers announce the card as an editable action
- [x] Delete is still protected by a confirmation dialog
- [x] Deleting an expense/income or transfer still reverts the wallet balance
- [x] Scrolling and pull-to-refresh are not affected
- [x] Accidental deletes are not possible from the list

## Technical Notes
- `TransactionItem` and `TransferItem` currently use `ThemedView` with `onTouchEnd`; replace the pressable wrapper with `Pressable` and keep the card styling.
- `TransactionsList` already passes `onEdit`, and the dashboard already passes `onPressTransfer`; the missing part is the visible affordance and reliable press handling.
- Delete confirmations now use the project-owned `ConfirmDialog` component. The
  previous `Alert.alert` path was replaced because `react-native-web` implements
  it as a no-op, which made the delete button do nothing on web.
- Confirmation copy lives in pure builders for movements, transfers and
  categories; the form modals own the confirmation state and call the direct
  delete callback only after the user confirms.
- An overflow menu with "Editar" and "Eliminar" is an option, but avoid adding a new dependency for it.
- This is a UX/discoverability ticket. The underlying create/edit/delete balance logic is already implemented and tested.

## Implemented
- Both cards now use `Pressable` wrapping the existing `ThemedView`, with pressed opacity feedback.
- A pencil badge at the right edge makes editing visible; it is decorative for screen readers.
- Cards expose `accessibilityRole="button"`, a movement-specific label and a hint that explains edit/delete.
- Delete remains inside the existing edit modal and uses a shared custom
  `ConfirmDialog`; no predefined `Alert` or browser `window.confirm` is used.
- Confirmation message builders for movements, transfers and categories are
  pure utilities with unit tests; manual platform checks are documented in the
  session note.

See `docs/project/development-notes/2026-11-08-movement-actions-ux.md`.

## Dependencies
- TICKET-002 Transactions
- TICKET-003 Transfers and Dashboard
