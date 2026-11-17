import { useMemo } from "react";

import type { Category } from "@/features/categories/types/category.types";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import type { CurrencyCode } from "@/shared/constants/currencies";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { SharedExpenseFieldErrors } from "../schemas/shared-expense.schema";
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
  errors: SharedExpenseFieldErrors;
  onWalletChange: (walletId: string) => void;
  onCategoryChange: (categoryId: string) => void;
}

/**
 * Mandatory personal movement of the shared expense: only the payer can own it,
 * so the block renders while the viewer is the payer and disappears when the
 * friend pays. The wallet is required because the spend must reach Movements;
 * the category appears once a wallet is selected.
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
  onWalletChange,
  onCategoryChange,
}: SharedExpenseLinkedMovementProps) {
  const { t, tr } = useScopedTranslation("sharedExpenses");
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
        onSelect={onWalletChange}
      />

      {hasWallet ? (
        <SharedExpenseCategoryField
          options={categoryOptions}
          selectedId={categoryId}
          disabled={disabled}
          errorText={categoryError}
          onChange={onCategoryChange}
        />
      ) : null}
    </>
  );
}
