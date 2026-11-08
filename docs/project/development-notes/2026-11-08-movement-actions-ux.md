# Session Note: Discoverable Movement Actions (TICKET-022)

**Date:** 08/11/2026  
**Ticket:** TICKET-022 / PM-022  
**Status:** ✅ Done

## Summary

Movement and recent-transfer cards now expose editing as a visible, accessible
action. Both list items use `Pressable` instead of `ThemedView` + `onTouchEnd`,
show a pencil badge at the right edge and give pressed feedback. Tapping the card
still opens the correct edit modal; delete remains inside that modal behind the
project-owned confirmation dialog.

The confirmation UI is now a project-owned component (`ConfirmDialog`) rendered
inside the form modal. It no longer depends on `Alert.alert` or
`window.confirm`, so the delete button also works on web (where
`react-native-web` implements `Alert.alert` as a no-op).

No balance, service, repository or Firestore behaviour changed. This was a
UX/accessibility ticket only.

## Architecture

| Layer | Files |
|---|---|
| Movement item | `features/transactions/components/transaction-item.tsx` |
| Movement styles | `features/transactions/styles/transaction-item.styles.ts` |
| Movement a11y | `features/transactions/utils/transaction-item-accessibility.ts` |
| Movement tests | `features/transactions/utils/__tests__/transaction-item-accessibility.test.ts` |
| Transfer item | `features/transfers/components/transfer-item.tsx` |
| Transfer styles | `features/transfers/styles/transfer-item.styles.ts` |
| Transfer a11y | `features/transfers/utils/transfer-item-accessibility.ts` |
| Transfer tests | `features/transfers/utils/__tests__/transfer-item-accessibility.test.ts` |
| Confirmation UI | `shared/components/molecules/confirm-dialog.tsx` + `.styles.ts` |
| Confirmation state | `shared/hooks/use-confirm-dialog.ts` |
| Movement message | `features/transactions/utils/transaction-delete-dialog.ts` |
| Transfer message | `features/dashboard/utils/transfer-delete-dialog.ts` |
| Category message | `features/categories/utils/category-delete-dialog.ts` |

Existing integration points were kept, with a small ownership change around
delete:

- `TransactionsList` still passes `onEdit(item)`.
- `DashboardTransfersSection` still passes `onPressTransfer(transfer)`.
- `useTransactionFormDialog` and `useDashboardTransferForm` still own the
  open/edit/delete lifecycle. Their delete callback now performs the deletion
  directly; the form modal owns the confirmation step.
- `TransactionsFormModal`, `DashboardTransferModal` and `CategoryFormModal`
  build the confirmation copy, open the custom dialog and only call the delete
  callback after the user confirms.

## Decisions

- **Pencil affordance**: a small `pencil-outline` badge communicates "edit"
  more explicitly than a chevron. No new dependency was added.
- **Whole card remains the target**: the badge is decorative; the full card is
  the `Pressable`, so the tap area stays large and obvious.
- **Pressed feedback**: the `Pressable` style callback applies opacity while
  pressed, giving feedback on iOS, Android and web without a ripple dependency.
- **Accessibility contract**: every card exposes `accessibilityRole="button"`,
  a label built from the record and a hint that explains it opens the form to
  edit or delete. The pencil badge is hidden from assistive technology.
- **Custom confirmation**: `ConfirmDialog` uses an absolute overlay inside the
  existing native `Modal` instead of nesting another `Modal`. This avoids iOS
  modal-presentation conflicts and gives consistent behavior on web.
- **Direct delete after confirm**: the hook callback performs the service call;
  the dialog only collects confirmation. A failed delete keeps the form open
  and shows the existing mutation error.
- **Platform back behavior**: when the confirmation is open, Android back
  closes only the confirmation; the modal's `onDismiss` also clears the
  confirmation state after any platform dismissal.
- **Testable copy**: confirmation messages are pure builders, so wording and
  wallet fallbacks are unit tested without a UI testing dependency.


## Manual platform checks

Run these on iOS, Android and web before release:

1. **Movement press**: tap an expense and an income card. The edit modal opens
   with the tapped movement, including concept, amount, wallet, category and date.
2. **Transfer press**: tap a recent transfer on the dashboard. The transfer modal
   opens with the tapped transfer and both wallets.
3. **Edit flow**: change an amount and save. The list updates and the wallet
   balance reflects the difference.
4. **Delete confirmation**: open a movement/transfer/category, press Eliminar
   and verify the custom in-app dialog appears above the form. Cancel keeps the
   record and balance.
5. **Confirmed delete**: confirm deletion. The record disappears and the wallet
   balance is reverted. Transfers remain soft-deleted on the server.
6. **Web delete**: repeat steps 4 and 5 in the browser. The custom dialog must be
   visible and the delete must run; no browser `window.confirm` should appear.
7. **Back behavior**: with the confirmation open, press Android back. Only the
   confirmation closes; the form stays open.
8. **Scrolling**: scroll both lists and pull to refresh. Cards must not open the
   edit modal while scrolling.
9. **Screen reader**: focus a card and confirm VoiceOver/TalkBack announces
   "Editar gasto/ingreso: …" or "Editar transferencia: … a …" followed by the
   edit/delete hint.
10. **Web keyboard**: tab to a card, press Enter/Space and confirm the modal opens.

## Verification

```powershell
npx tsc --noEmit
npx expo lint
npx jest --runInBand
```

All pass (63 suites, 308 tests).
