# TICKET-037 - Audit and Extract Reusable Shared Components

**Type:** Refactor / Architecture  
**Priority:** Medium  
**Status:** ⏳ Pending  
**Related:** PM-037; TICKET-033, TICKET-034, TICKET-035, TICKET-036, TICKET-038  
**Sprint:** Post-MVP / Phase 3.6  

## Description
Several features reimplement the same UI behavior with different styles: loading, error and empty states, form headers/actions/fields, error banners and list rows. Extract the repeated pieces into `shared/components` so future features reuse them, while feature wrappers keep their copy, data and accessibility details. Start with a written inventory, then extract in small verified steps. The detail-view extraction is already delivered by TICKET-035 and is excluded here.

## Requirements
- [ ] Write `docs/project/development-notes/component-inventory.md` with each duplicated pattern, the current files, the proposed shared component and its props
- [ ] Extract the full-screen state components first: loading, error (with retry) and empty (with optional action)
- [ ] Extract the form building blocks: error banner, header, actions, amount field, notes field and date-field wrapper
- [ ] Evaluate and extract a page-sheet modal shell shared by the transaction, transfer and wallet form modals
- [ ] Extract a base list-row card shared by `TransactionItem` and `TransferItem`, keeping feature wrappers for labels, icons and data
- [ ] Keep user-visible copy out of the shared components: titles, messages, button labels and accessibility labels arrive as props so TICKET-031 can translate them later
- [ ] Delete the feature styles and imports that become dead after each extraction; do not leave duplicated variants behind
- [x] Resolve the unused `shared/components/atoms` (`button.tsx`, `input.tsx`, `text.tsx`): adopted nowhere and removed in TICKET-038, so no second button/input system remains
- [ ] Keep every extracted component under 150 lines and one component per file
- [ ] Preserve markup, copy, accessibility labels and dark-mode/web behavior; document any intentional visual change
- [ ] Update or add tests for the pure helpers touched by the extractions and keep the existing suites green

## Acceptance Criteria
- [ ] The inventory lists every duplicated pattern with a decision: extract, keep or remove
- [ ] Each listed pattern has one shared implementation used by at least two features, or a documented reason to stay feature-specific
- [ ] No duplicated loading/error/empty implementation remains for wallets, transactions and transfer history
- [ ] Transaction and transfer forms share the same header, actions, amount, notes and date-field implementations
- [ ] `TransactionItem` and `TransferItem` share the row/card base without changing their accessibility labels or content
- [ ] No dead styles, imports or unused shared atoms remain
- [ ] `npx tsc --noEmit`, `npx expo lint` and `npx jest` pass
- [ ] Dark mode and web remain unchanged for every touched screen

## Initial inventory (analysis)
| Pattern | Current implementations | Proposed shared component |
|---|---|---|
| Loading state | `wallets/components/wallets-loading-state.tsx`, `transactions/components/transactions-loading-state.tsx`, `transfers/components/transfer-history-loading-state.tsx` | `shared/components/molecules/loading-state.tsx` (`message`, `size`) |
| Error state | `wallets-error-state.tsx`, `transactions-error-state.tsx`, `transfer-history-error-state.tsx` | `shared/components/molecules/error-state.tsx` (`title`, `message`, `onRetry`, `retryAccessibilityLabel`) |
| Empty state | `wallets-empty-state.tsx`, `transactions-empty-state.tsx`, `transfer-history-empty-state.tsx`, dashboard inline empty cards | `shared/components/molecules/empty-state.tsx` (icon, title, message, primary/secondary action slots) |
| Form error banner | `transaction-form-error-banner.tsx`, `transfer-form-error-banner.tsx`, dashboard inline error | `shared/components/molecules/error-banner.tsx` (`message`, optional inline variant) |
| Form header | `transaction-form-header.tsx`, `transfer-form-header.tsx` | `shared/components/molecules/form-header.tsx` |
| Form actions | `transaction-form-actions.tsx`, `transfer-form-actions.tsx` | `shared/components/molecules/form-actions.tsx` (labels as props) |
| Amount field | `transaction-form-amount-field.tsx`, `transfer-form-amount-field.tsx` | `shared/components/molecules/amount-field.tsx` (`helper`, `accessibilityLabel`) |
| Notes field | `transaction-form-notes-field.tsx`, `transfer-form-notes-field.tsx` | `shared/components/molecules/notes-field.tsx` (`maxLength`, `placeholder`, `accessibilityLabel`) |
| Date field | `transaction-form-date-field.tsx`, `transfer-form-date-field.tsx` | `shared/components/molecules/date-form-field.tsx` over `DateQuickSelector` |
| Form modal shell | `transactions-form-modal.tsx`, `transfer-form-modal.tsx`, `wallets-form-modal.tsx` | `shared/components/molecules/page-sheet-form-modal.tsx` |
| List row | `transactions/components/transaction-item.tsx`, `transfers/components/transfer-item.tsx` | `shared/components/molecules/record-card.tsx` with icon/title/meta/amount/affordance slots |
| Shared atoms | `shared/components/atoms/button.tsx`, `input.tsx`, `text.tsx` (no consumers) | Removed in TICKET-038; no shared atom system is needed until a real consumer appears |

## Technical Notes
- The duplicated error states differ only in title, accessibility label and styles; the loading states only in message and size. The form amount/notes/date fields and form actions are nearly line-for-line copies between transactions and transfers.
- `TransactionItem` and `TransferItem` already share the same card anatomy (pressable, icon wrapper, title/meta, amount, pencil affordance); only the data and labels differ. Keep `getTransferEditLabel`/`getTransactionDetailLabel` in their features.
- `ConfirmDialog` and `DateQuickSelector` are already shared; follow their naming and folder level (`shared/components/molecules`).
- Themes must keep coming from `useFormTheme`; shared components must not import feature palettes.
- Suggested order: states → banners/headers/actions/fields → modal shell → list row → unused atoms. Run `tsc`, lint and jest after each group and keep one commit per group.
- **Out of scope:** redesigns, new features, changing flows, the detail-view scaffold (TICKET-035) and i18n extraction (TICKET-031).

## Dependencies
- TICKET-033 Dashboard recent data
- TICKET-034 Dashboard movement detail
- TICKET-035 Transfer detail and shared detail view
- TICKET-036 Dashboard transfer detail
