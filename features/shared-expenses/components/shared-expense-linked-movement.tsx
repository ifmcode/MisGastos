import { useMemo } from "react";

import type { Category } from "@/features/categories/types/category.types";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import type { CurrencyCode } from "@/shared/constants/currencies";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type {
  SharedExpenseLinkFieldErrors,
  SharedExpenseLinkScope,
} from "../types/shared-expense-link.types";
import {
  getSharedExpenseCategoryOptions,
  getSharedExpenseWalletOptions,
} from "../utils/shared-expense-link-options";
import { SharedExpenseCategoryField } from "./shared-expense-category-field";
import { SharedExpenseWalletField } from "./shared-expense-wallet-field";

export interface SharedExpenseLinkedMovementProps {
  wallets: readonly Wallet[];
  categories: readonly Category[];
  payerId: string;
  viewerUid: string;
  currency: CurrencyCode;
  walletId: string;
  categoryId: string;
  disabled: boolean;
  /** Wallet/category codes; both form schemas satisfy the narrow contract. */
  errors: SharedExpenseLinkFieldErrors;
  /** Copy namespace; the 1:1 form is the default, groups pass their own. */
  scope?: SharedExpenseLinkScope;
  onWalletChange: (walletId: string) => void;
  onCategoryChange: (categoryId: string) => void;
}

/**
 * Personal movement of a socially shared expense while the registration toggle
 * is **Yes**, shared by the 1:1 and the group forms with their own copy. Only
 * the payer can own it, so the block renders while the viewer is the payer and
 * disappears when someone else pays or the toggle is off. The wallet is
 * required because the spend must reach Movements; the category appears once a
 * wallet is selected.
 */
export function SharedExpenseLinkedMovement({
  wallets,
  categories,
  payerId,
  viewerUid,
  currency,
  walletId,
  categoryId,
  disabled,
  errors,
  scope = "sharedExpenses",
  onWalletChange,
  onCategoryChange,
}: SharedExpenseLinkedMovementProps) {
  const { t, tr } = useScopedTranslation(scope);
  const trimmedWalletId = walletId.trim();
  const hasWallet = trimmedWalletId.length > 0;
  const walletOptions = useMemo(
    () => getSharedExpenseWalletOptions(wallets, currency, trimmedWalletId),
    [currency, trimmedWalletId, wallets],
  );
  // No wallet, no options: the synthetic "Gastos compartidos" category must not
  // linger as a stale choice in the missing-wallet state.
  const categoryOptions = useMemo(
    () =>
      hasWallet
        ? getSharedExpenseCategoryOptions(categories, viewerUid, categoryId)
        : [],
    [categories, categoryId, hasWallet, viewerUid],
  );
  const walletError = errors.walletId
    ? tr(`errors.${errors.walletId}`)
    : null;
  const categoryError = errors.categoryId
    ? tr(`errors.${errors.categoryId}`)
    : null;
  const walletEmpty = t("form.walletEmpty", { currency });

  if (payerId !== viewerUid) return null;

  return (
    <>
      <SharedExpenseWalletField
        wallets={walletOptions}
        selectedId={trimmedWalletId}
        disabled={disabled}
        errorText={walletError}
        emptyText={walletEmpty}
        scope={scope}
        onSelect={onWalletChange}
      />

      {hasWallet ? (
        <SharedExpenseCategoryField
          options={categoryOptions}
          selectedId={categoryId}
          disabled={disabled}
          errorText={categoryError}
          scope={scope}
          onChange={onCategoryChange}
        />
      ) : null}
    </>
  );
}
