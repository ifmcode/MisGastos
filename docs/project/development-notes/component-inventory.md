# Shared Component Inventory

> Audit delivered by TICKET-037 on 13/11/2026. Scope: duplicated UI behavior across
> wallets, transactions, transfers, categories and the dashboard. The reusable
> detail-view scaffold (TICKET-035), `ConfirmDialog`, `DateQuickSelector`,
> `WalletChipSelector` and the translation layer were already shared and are listed
> here only to state that they stay as they are.

## Decisions

| Pattern | Current implementations | Decision | Shared implementation |
|---|---|---|---|
| Loading state | `wallets/components/wallets-loading-state.tsx`, `transactions/components/transactions-loading-state.tsx`, `transfers/components/transfer-history-loading-state.tsx`, `categories/components/categories-loading-state.tsx`, `dashboard/components/dashboard-loading-state.tsx`, dashboard section loaders | **Extract** | `shared/components/molecules/loading-state.tsx` |
| Error state | `wallets-error-state.tsx`, `transactions-error-state.tsx`, `transfer-history-error-state.tsx`, `categories-error-state.tsx`, `dashboard-error-state.tsx`, dashboard section errors | **Extract** | `shared/components/molecules/error-state.tsx` |
| Empty state | `wallets-empty-state.tsx`, `transactions-empty-state.tsx`, `transfer-history-empty-state.tsx`, `categories-empty-state.tsx`, dashboard empty cards | **Extract** | `shared/components/molecules/empty-state.tsx` |
| Form error banner | `transaction-form-error-banner.tsx`, `transfer-form-error-banner.tsx`, inline wallet/category form errors, detail-modal error slot | **Extract** | `shared/components/molecules/error-banner.tsx` |
| Form header | `transaction-form-header.tsx`, `transfer-form-header.tsx`, `wallet-form-header.tsx`, `category-form-header.tsx`, `transaction-filters-header.tsx` | **Extract** | `shared/components/molecules/form-header.tsx` |
| Form actions | `transaction-form-actions.tsx`, `transfer-form-actions.tsx`, `wallet-form-actions.tsx`, `category-form-actions.tsx` | **Extract** | `shared/components/molecules/form-actions.tsx` |
| Amount field | `transaction-form-amount-field.tsx`, `transfer-form-amount-field.tsx` | **Extract** | `shared/components/molecules/amount-field.tsx` |
| Notes field | `transaction-form-notes-field.tsx`, `transfer-form-notes-field.tsx` | **Extract** | `shared/components/molecules/notes-field.tsx` |
| Date field | `transaction-form-date-field.tsx`, `transfer-form-date-field.tsx` | **Extract** | `shared/components/molecules/date-form-field.tsx` over `DateQuickSelector` |
| Form modal shell | `transactions-form-modal.tsx`, `transfer-form-modal.tsx`, `wallets-form-modal.tsx`, `category-form-modal.tsx` | **Extract** | `shared/components/molecules/page-sheet-form-modal.tsx` |
| List row | `transactions/components/transaction-item.tsx`, `transfers/components/transfer-item.tsx` | **Extract** | `shared/components/molecules/record-card.tsx` |
| Floating action button | `transactions-fab.tsx`, inline FAB in `wallets-screen.tsx` and `categories-screen.tsx` | **Extract** | `shared/components/molecules/fab.tsx` |
| Label / input / error / helper / counter / amount styles | duplicated in every feature form style module | **Extract styles** | `shared/components/molecules/form-field.styles.ts` |
| Row meta separator (` · `) | `transaction-item.tsx`, `transfer-item.tsx` | **Extract helper** | `shared/utils/join-meta.ts` (`joinMetaParts`) |
| Info banner | `transfer-form-info-banner.tsx` only | **Keep** | Single consumer; its bordered/neutral layout differs from the error banner |
| Text fields | movement concept, wallet name/description, category name | **Keep wrappers** | Validation codes and copy stay in each feature; only the styles moved to `form-field.styles.ts` |
| Screen headers | wallets, transactions, categories, transfer history, dashboard | **Keep** | Each header owns different actions (add filter, back, greeting) and copy |
| Dashboard section header | `dashboard-section-header.tsx` | **Keep** | Single feature and a distinct "Ver todos" action contract |
| Filter and delete action rows | `transaction-filters-actions.tsx`, `wallet-delete-footer.tsx` | **Keep** | Different action set (reset/apply, dangerous confirm) and danger content |
| Wallet / category cards | `wallet-card.tsx`, `category-card.tsx` | **Keep** | Different anatomy (balance/archive badge, reorder controls, colour stripe) |
| Screen mutation error | inline banner in `wallets-screen.tsx` | **Keep** | No icon and screen-level spacing; a form banner would change the visual result |
| Shared atoms | `shared/components/atoms/button.tsx`, `input.tsx`, `text.tsx` | **Removed previously** | Removed in TICKET-038; no consumers and no second UI system |
| `ConfirmDialog` / `DateQuickSelector` / wallet pickers | already shared | **Keep** | Used by at least two features |

## Extracted components

### `LoadingState`

```ts
interface LoadingStateProps {
  message: string;                 // already translated
  variant?: "screen" | "inline";   // full screen (default) or section row
  size?: "small" | "large";
}
```

Consumers: wallets list, transactions screen, transfer history, categories screen,
dashboard screen and both dashboard recent sections. The inline variant preserves
the dashboard row layout; the screen variant preserves the centered full-screen state.

### `ErrorState`

```ts
interface ErrorStateProps {
  title?: string;                  // screen variant only
  message: string;
  retryLabel: string;
  retryAccessibilityLabel: string;
  onRetry: () => void;
  variant?: "screen" | "inline";
}
```

Consumers: the same screens plus the dashboard recent sections. The inline variant
keeps the danger card and the text-only retry action; the screen variant keeps the
cloud-offline icon, title and primary retry button.

### `EmptyState`

```ts
interface EmptyStateAction {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  icon?: IoniconsName;
}

interface EmptyStateProps {
  icon?: IoniconsName;             // screen variant only
  title: string;
  message: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  variant?: "screen" | "card";
}
```

Consumers: wallets (create action), transactions (create or clear filters),
transfer history (no action), categories (create action) and the dashboard recent
sections (`card`, no icon/action).

### `ErrorBanner`

```ts
interface ErrorBannerProps {
  message?: string | null;         // renders nothing when empty
}
```

Consumers: transaction/transfer/wallet/category forms and both read-only detail
modals. Copy arrives as a prop; the component only owns the danger styling.

### `FormHeader`

```ts
interface FormHeaderProps {
  title: string;
  subtitle: string;
  closeAccessibilityLabel: string;
  disabled?: boolean;
  onClose: () => void;
}
```

Consumers: transaction, transfer, wallet, category and transaction-filter headers.

### `FormActions`

```ts
interface FormActionsProps {
  submitting: boolean;
  isEditing: boolean;
  canSubmit?: boolean;             // defaults to true
  cancelLabel: string;
  cancelAccessibilityLabel: string;
  submitLabel: string;
  submitAccessibilityLabel: string;
  deleteLabel?: string;
  deleteAccessibilityLabel?: string;
  onCancel: () => void;
  onSubmit: () => void;
  onDelete?: () => void;           // renders the delete button when present
}
```

Consumers: transaction, transfer, wallet and category forms. Each feature wrapper
keeps its translation keys, label differences and the delete confirmation flow.

### `AmountField`, `NotesField` and `DateFormField`

| Component | Props (copy comes resolved) |
|---|---|
| `AmountField` | `label`, `value`, `symbol`, `placeholder`, `accessibilityLabel`, `errorText?`, `helperText?`, `disabled`, `onChange` |
| `NotesField` | `label`, `value`, `placeholder`, `accessibilityLabel`, `maxLength`, `errorText?`, `disabled`, `onChange` |
| `DateFormField` | `label`, `text`, `value`, `error?`, `helperText`, `accessibilityLabel`, `disabled`, `showLastUsedDate?`, `onChange` |

Consumers: the transaction and transfer forms through their existing feature
wrappers, which resolve validation codes and translation keys.

### `PageSheetFormModal`

```ts
interface PageSheetFormModalProps {
  visible: boolean;
  onRequestClose: () => void;
  onDismiss?: () => void;
  presentationStyle?: ModalProps["presentationStyle"];
  children: ReactNode;
}
```

Consumers: transaction, transfer, wallet and category form modals. The transaction,
transfer and category modals keep their own delete confirmation copy and dialog
state as children.

### `RecordCard`

```ts
interface RecordCardProps {
  accessibilityLabel: string;
  accessibilityHint: string;
  onPress: () => void;
  icon: IoniconsName;
  title: string;
  meta: string;
  amount: string;
  amountColor?: string;
  secondaryAmount?: string;
  affordanceIconSize?: number;
}
```

Consumers: `TransactionItem` (category icon, concept, date/category/wallet meta,
signed amount plus currency, success/danger tone) and `TransferItem` (swap icon,
origin → destination, date/notes meta, unsigned amount). Feature utilities keep the
accessibility labels: `getTransactionDetailLabel`, `getTransferEditLabel` and
`getTransferDetailLabel`.

### `Fab`

```ts
interface FabProps {
  accessibilityLabel: string;
  bottom: number;
  onPress: () => void;
}
```

Consumers: wallets, transactions and categories screens.

## Removed after extraction

- Feature state components: `wallets-*-state`, `transactions-*-state`,
  `transfer-history-*-state`, `categories-*-state`, `dashboard-*-state`.
- Feature form error banners and their style keys.
- `transaction-item.styles.ts` and `transfer-item.styles.ts` (now `record-card.styles.ts`).
- Dead header, actions, field, FAB and feedback style keys in every touched styles
  module, plus unused palette entries (`walletFormPalette`, `categoryFormPalette`,
  `transferFormPalette`, `transferHistoryPalette` and the unused dashboard danger /
  soft tones).
- `confirmDialogStyles.modalRoot`, now owned by `PageSheetFormModal`.

## Intentional visual changes

- Wallet form actions now use the shared `gap: 10` and the shared min widths
  (`110`/`130`), matching the transaction, transfer and category forms. The previous
  wallet-only values were `gap: 12` with no min widths.
- Every other markup, copy, accessibility label and theme token is preserved. The
  transfer card keeps its 15 px chevron and the wallet form keeps its own balance
  field styles.

## Verification

- `npx tsc --noEmit`
- `npx expo lint`
- `npx jest` (141 suites / 645 tests)
- `npm run check:copy` (157 TSX files)
- Dark mode and web follow the same `useFormTheme` tokens as before; shared
  components never import feature palettes.
