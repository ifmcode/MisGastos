# Shared Component Inventory

> Audit delivered by TICKET-037 on 13/11/2026. Scope: duplicated UI behavior across
> wallets, transactions, transfers, categories and the dashboard. The reusable
> detail-view scaffold (TICKET-035), `ConfirmDialog`, `DateQuickSelector` and the
> translation layer were already shared and are listed here only to state that they
> stay as they are.
> Updated by TICKET-041 (16/11/2026) with the FAB action menu; the TICKET-037
> decisions above are unchanged.
> Updated again by TICKET-043 (16/11/2026) with the route-safe `DetailView`,
> `useDetailActions` and the shared-expense detail pieces; no palette was added.
> TICKET-045 (16/11/2026) adds the movements tab as the second `FabActionMenu`
> consumer; the extracted components and their props are unchanged.
> TICKET-047 (18/11/2026) adds no shared molecule: the inbox segment control
> mirrors the Social tab pattern as a feature component, and the only new shared
> seams are `shared/hooks/use-detail-close-navigation.ts` (the close rule both
> notification targets share) and `formatRelativeTime` in
> `shared/utils/format.ts`, exposed as `formatRelative` by `useAppLocale`. The
> decisions table below is unchanged.
> TICKET-055 (18/11/2026) also adds no shared molecule: the wallet-registration
> switch and the Settings default are feature components, and the only removal is
> the TICKET-048 `SharedExpenseWalletWarning`, whose state became valid.
> TICKET-056 (20/11/2026) adds the `CurrencyField` + `CurrencyPickerDialog` pair
> (compact currency row whose dialog content is the existing chip selector), the
> pure `formatCurrencyLabel` in `shared/utils/` and the feature-only
> `SharedExpenseSplitRemaining` line; `CurrencyChipSelector` keeps its consumers.
> TICKET-065 (22/11/2026) replaces the compact chip row (`WalletChipSelector`) with
> the feature component `WalletSelectButton` and adds the optional `noneOption` row
> to `WalletPickerDialog`; no `shared/components` molecule changed.

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
| FAB action menu | no prior implementation; `ActionSheetIOS` rejected (Android/web) | **Extract (TICKET-041)** | `shared/components/molecules/fab-action-menu.tsx` |
| Label / input / error / helper / counter / amount styles | duplicated in every feature form style module | **Extract styles** | `shared/components/molecules/form-field.styles.ts` |
| Row meta separator (` · `) | `transaction-item.tsx`, `transfer-item.tsx` | **Extract helper** | `shared/utils/join-meta.ts` (`joinMetaParts`) |
| Currency chips | wallet form currency selector and the TICKET-006 profile currency selector | **Extract (TICKET-006)** | `shared/components/molecules/currency-chip-selector.tsx` |
| Compact currency field | shared-expense form inline chips and the wallet form currency selector | **Extract (TICKET-056)** | `shared/components/molecules/currency-field.tsx` + `currency-picker-dialog.tsx` |
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
modals. Copy arrives as a prop; the component only owns the danger styling. It
exposes `accessibilityRole="alert"` and `accessibilityLiveRegion="polite"`, so
assistive technology announces the message when it appears.

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
| `AmountField` | `label`, `value`, `symbol`, `placeholder`, `accessibilityLabel`, `errorText?`, `helperText?`, `helperLive?`, `disabled`, `onChange` |
| `NotesField` | `label`, `value`, `placeholder`, `accessibilityLabel`, `maxLength`, `errorText?`, `disabled`, `onChange` |
| `DateFormField` | `label`, `valueIso`, `error?`, `accessibilityLabel`, `disabled`, `showLastUsedDate?`, `onSelectDate` |

Consumers: the transaction, transfer, shared-expense, group-expense and
settlement forms, plus the transaction date filters through
`DateQuickSelector` directly; the feature wrappers resolve validation codes and
translation keys. Since TICKET-063 there is no manual input: `DateQuickSelector`
renders the Hoy/Ayer (and optional Último) chips, a 48x48 calendar pinned at the
right of a wrapping `flex: 1` chip group, and one summary/error line derived by
`getDateFieldSummary` (`error` always wins the slot).

`AmountField.helperLive` (opt-in, default `false`) marks the helper as polite
live feedback: Android gets `accessibilityRole="text"` +
`accessibilityLiveRegion="polite"` and iOS a queued
`announceForAccessibilityWithOptions`; the mount value is skipped and nothing is
announced while an error shows. The settlement amount section consumes it for
the live remaining-debt line.

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

### `DetailView` / `useDetailActions`

```ts
interface DetailViewProps {
  title: string;
  subtitle: string;
  summary?: DetailSummary;
  fields?: readonly DetailField[];
  missing: boolean;                // shows DetailMissingState instead of the body
  disabled?: boolean;
  labels: DetailActionLabels;
  missingLabels: DetailMissingStateLabels;
  errorContent?: ReactNode;        // feature banner above the summary
  children?: ReactNode;            // extra blocks after the fields card
  closeIcon?: DetailCloseIcon;     // "back" on routes, "close" inside a modal
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

interface UseDetailActionsOptions {
  deleteConfirmation: DetailDeleteConfirmation | null;   // null = no-op
  onConfirmDelete: () => Promise<boolean>;               // true = leave the detail
  onClose: () => void;
}
```

`shared/components/organisms/detail-view.tsx` is the route-safe layout: header
(title, subtitle, edit/delete, optional back/close icon), summary card, fields card,
the optional feature banner and children slot, and the missing-record state that
replaces the body. It owns no navigation, no `Modal` and no dialog state, so
`DetailModal` (movements and transfers) and the shared-expense route share one
layout; `DetailHeader` exposes `closeIcon`/`closeHint` for the back variant and
`DetailSummaryCard` announces label + amount only. `shared/hooks/use-detail-actions.ts`
wraps `useConfirmDialog` and closes the detail only after `onConfirmDelete` reports
success, so a failed delete keeps the record and its banner on screen. Consumers:
`DetailModal` and `features/social` (`SharedExpenseDetailScreen`).

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

### Shared-expense detail pieces

TICKET-043 reused existing shared-expense UI instead of adding a second set:
`features/shared-expenses/components/shared-expense-participants.tsx` renders the
per-participant shares (viewer first, legacy percentage/shares through
`formatBpsText` and the stored `weight`), `SharedExpenseEditorModal` is mounted by both
the friend detail and the detail route, and `shared-expense-row.tsx` is now a single
pressable that opens `/social/expenses/[expenseId]` (its former inline actions
component was deleted). The detail layout and colours stay shared; the route only adds
a one-key shell style module, and the participants section reuses the existing
shared-expenses style module, so no new palette was introduced.

TICKET-055 superseded TICKET-048's mandatory wallet: when the viewer pays, a
Yes/No switch (`SharedExpenseWalletRegistration`,
`features/shared-expenses/components/shared-expense-wallet-registration.tsx`)
decides whether the expense registers in a wallet. **No** hides the wallet and
category block and creates no movement; **Yes** keeps the `SharedExpenseWalletField`
(localized `WALLET_REQUIRED` error and the guidance to create a wallet in
**Carteras**) plus the category block. The legacy `SharedExpenseWalletWarning` and
`hasViewerPaidWithoutWallet` were deleted because a social-only viewer-paid
expense is now an intended state. The account default is a Settings row
(`SettingsSharedExpenseToggle`,
`features/settings/components/settings-shared-expense-toggle.tsx`) backed by the
`users.registerSharedExpensesInWallet` field. `shared-expense-form.tsx` was split
into the page-sheet shell plus `shared-expense-form-body.tsx` to keep both files
under 150 lines.

TICKET-050 removed the system **Gastos compartidos** category from the linked
movement picker (it is neither offered nor preselected) and `shared-expense-form-body.tsx`
now renders the server error or first field error in an alert notice directly
above `FormActions`, so a blocked save explains itself next to **Guardar**.

TICKET-051 made the category mandatory for a linked movement: the schema and the
service reject a linked expense without one (`CATEGORY_REQUIRED`), the hidden
`ensureSharedExpenseCategory` default was removed, and the error renders under the
category field. Social-only friend-paid expenses keep `categoryId: null`. The
form notice uses new amber `warning`/`warningSurface`/`warningText` theme tokens
for field-summary notices, while server errors keep the danger palette.

TICKET-056 keeps the fixed split informative: `SharedExpenseSplitRemaining`
(`features/shared-expenses/components/shared-expense-split-remaining.tsx`) renders
`Total … · Falta: …` / `· Completo` / `· Sobra: …` (danger tone) after the
participant rows and before the existing error text, with
`accessibilityLiveRegion="polite"` and no focus change. The math lives in the pure
`getFixedSplitRemaining`/`formatRemainingCents`
(`features/shared-expenses/utils/expense-remaining.ts`) over integer cents, and
`FIXED_SUM_MISMATCH`/`INVALID_FIXED_AMOUNT` still decide whether the form saves.
`features/transactions/utils/transaction-form-defaults.ts` and
`features/transfers/utils/transfer-form-defaults.ts` accept the profile preferred
currency as an optional last argument. Since TICKET-065 a new movement or transfer
starts with no wallet (and a transfer destination is chosen explicitly after the
source); that currency is only provisional and the selected wallet currency replaces
it, while edits keep the stored values.

### `Fab`

```ts
interface FabProps {
  accessibilityLabel: string;      // already translated
  accessibilityHint?: string;      // already translated; explains what the FAB opens
  bottom: number;
  onPress: () => void;
}
```

Consumers: wallets, transactions, categories and the Social hub (`social-fab.tsx`).
Wallets and categories still run their create action directly; transactions
(since TICKET-045) and the Social hub (TICKET-041) use the FAB only to open the
shared `FabActionMenu`. The optional hint was added in TICKET-041 so both FABs can
announce that they open an action menu.

### `FabActionMenu`

```ts
interface FabActionMenuAction {
  key: string;
  label: string;                   // already translated
  icon: IoniconsName;
  hint?: string;                   // already translated, rendered under the label
  disabled?: boolean;
  onPress: () => void;
}

interface FabActionMenuProps {
  visible: boolean;
  title: string;                   // already translated menu header
  onClose: () => void;
  actions: readonly FabActionMenuAction[];
}
```

Consumers: `features/social/components/social-fab.tsx` with one action
(**Añadir amigo** → `/social/add-friend`) and, since TICKET-045,
`features/transactions/components/transactions-fab.tsx` built from
`getMovementsFabActions`/`getMovementsFabMenuActions`
(`features/transactions/utils/movements-fab-actions.ts`). The movements menu has
**Nuevo movimiento** (the existing personal form), **Gasto con amigo** (the shared
`SharedExpenseEditorModal` with no preselected friend; disabled with a hint pointing
to **Social** when there are no accepted friends, and with the neutral hint while the
overview loads or fails) and **Gasto de grupo** (always disabled with the
**Próximamente** hint). The component owns the transparent `Modal`
(`overFullScreen`/`fade`/`statusBarTranslucent`/`onRequestClose`), the backdrop
that closes on press, the themed card with safe-area padding, one accessible row
per action (`accessibilityRole="button"` + `accessibilityState.disabled`), the
disabled rendering and the close-then-`onPress` order. It knows nothing about
friends, groups or movements: every string arrives translated and `disabled`
actions are simply absent or flagged by the caller.

### `CurrencyChipSelector`

```ts
interface CurrencyChipSelectorProps {
  value: CurrencyCode;
  disabled?: boolean;
  currencies?: readonly CurrencyOption[];
  getAccessibilityLabel: (currency: CurrencyOption) => string;
  onChange: (currency: CurrencyCode) => void;
}
```

Consumers: the currency picker dialog, the profile form through `ProfileCurrencyField`
and the settlement currency chips; the wallet and shared-expense forms reach the
chips through `CurrencyField`. The shared constants (`CURRENCIES`) and the
selected/unselected theme tokens stay in one place; each feature supplies its own
translated accessibility label.

### `CurrencyField` / `CurrencyPickerDialog`

```ts
interface CurrencyFieldProps {
  label: string;                     // already translated
  value: CurrencyCode;
  disabled?: boolean;                // also blocks the picker action
  changeLabel: string;
  changeAccessibilityLabel: string;
  changeAccessibilityHint: string;
  pickerTitle: string;
  pickerCloseAccessibilityLabel: string;
  pickerGroupAccessibilityLabel: string;
  getCurrencyAccessibilityLabel: (currency: CurrencyOption) => string;
  onChange: (currency: CurrencyCode) => void;
}

interface CurrencyPickerDialogProps {
  visible: boolean;
  title: string;
  closeAccessibilityLabel: string;
  groupAccessibilityLabel: string;
  value: CurrencyCode;
  getCurrencyAccessibilityLabel: (currency: CurrencyOption) => string;
  onChange: (currency: CurrencyCode) => void;
  onClose: () => void;
}
```

`CurrencyField` renders the label, `formatCurrencyLabel(value)` (`EUR €`) and a
≥44x44 text action in `theme.primary`; it owns the dialog visibility and closes on
select. `CurrencyPickerDialog` keeps the transparent `overFullScreen`/fade
`Modal`, the backdrop, `accessibilityViewIsModal`, `onAccessibilityEscape`, the
header title and close button, and renders `CurrencyChipSelector` as its content,
so there is still one currency list. Consumers: the shared-expense form
(`SharedExpenseFormMainFields`, `sharedExpenses` copy) and the wallet form
(`WalletFormCurrencySelector`, `wallets` copy). The profile selector keeps the
plain chips.

### `WalletSelectButton` / `WalletPickerDialog`

```ts
interface WalletSelectButtonProps {
  wallet: Wallet | null;             // null while the field is empty
  disabled: boolean;
  hasError?: boolean;                // danger border, set by the caller
  accessibilityPrefix: string;       // already translated field context
  onPress: () => void;
}

interface WalletPickerDialogProps {
  visible: boolean;
  wallets: readonly Wallet[];
  selectedId: string;
  disabled: boolean;
  accessibilityPrefix: string;
  noneOption?: { label: string; accessibilityLabel: string };
  onSelect: (walletId: string) => void;
  onClose: () => void;
}
```

TICKET-065 replaced the former compact chip row with one trigger button in
`features/wallets/components/wallet-select-button.tsx`: **Seleccionar cartera** while
empty, otherwise the wallet name, its currency and the archived badge, with a wallet
icon, a chevron, a 44pt+ target and the danger border on a field error. Consumers:
movement wallet, transfer source and destination, the shared-expense wallet while the
registration toggle is **Yes**, and the settlement's optional wallet. `WalletPickerDialog`
stays the read-only popup and gained the optional `noneOption` first row (the
settlement's **Sin cartera**), selected while `selectedId` is empty; both components
live in `features/wallets/components` and own their `wallets` copy, like
`WalletPickerOption`.

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
- `WalletChipSelector`, `getWalletChips`/`COMPACT_WALLET_LIMIT` and the chip styles,
  replaced by `WalletSelectButton` and `WalletPickerDialog` in TICKET-065.

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
- `npx jest` (331 suites / 2026 tests, updated after TICKET-065)
- `npm run check:copy` (310 TSX files)
- Dark mode and web follow the same `useFormTheme` tokens as before; shared
  components never import feature palettes.
