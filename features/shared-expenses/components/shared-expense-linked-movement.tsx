import { useMemo } from "react";

import type { Category } from "@/features/categories/types/category.types";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import type { CurrencyCode } from "@/shared/constants/currencies";

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
  onWalletChange: (walletId: string) => void;
  onCategoryChange: (categoryId: string) => void;
}

/**
 * Optional personal movement of the shared expense. Only the payer can own it,
 * so the block renders while the viewer is the payer and disappears when the
 * friend pays. The category appears once a wallet is selected.
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
  onWalletChange,
  onCategoryChange,
}: SharedExpenseLinkedMovementProps) {
  const walletOptions = useMemo(
    () => getSharedExpenseWalletOptions(wallets, currency, walletId),
    [currency, walletId, wallets],
  );
  const categoryOptions = useMemo(
    () => getSharedExpenseCategoryOptions(categories, viewerUid, categoryId),
    [categories, categoryId, viewerUid],
  );

  if (payerId !== viewerUid) return null;

  return (
    <>
      <SharedExpenseWalletField
        wallets={walletOptions}
        selectedId={walletId}
        disabled={disabled}
        onSelect={onWalletChange}
      />

      {walletId.length > 0 ? (
        <SharedExpenseCategoryField
          options={categoryOptions}
          selectedId={categoryId}
          disabled={disabled}
          onChange={onCategoryChange}
        />
      ) : null}
    </>
  );
}
