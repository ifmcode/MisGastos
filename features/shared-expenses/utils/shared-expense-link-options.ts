import type { Category } from "@/features/categories/types/category.types";
import {
  getCategoryIconName,
  type CategoryIcon,
} from "@/features/categories/utils/category-options";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import { getActiveWallets } from "@/features/wallets/utils/wallet-status";
import type { CurrencyCode } from "@/shared/constants/currencies";
import type { Translate } from "@/shared/i18n/translate";

import { getSharedExpenseCategoryId } from "../services/shared-expense-category";

/** Maximum number of category chips shown inline before the `+` action. */
export const SHARED_EXPENSE_CATEGORY_CHIP_LIMIT = 3;

/** Synthetic labels: the shared category may not exist as a document yet. */
export const SHARED_EXPENSE_CATEGORY_LABEL_KEY = "form.categoryDefault";
export const SHARED_EXPENSE_CATEGORY_FALLBACK_KEY = "form.categoryUnavailable";

export interface SharedExpenseCategoryOption {
  id: string;
  /** Stored name; empty when `labelKey` resolves the translated label. */
  label: string;
  labelKey?: string;
  icon: CategoryIcon;
}

/**
 * Active wallets usable as the linked movement's wallet. When editing, the
 * stored wallet stays visible even if it was archived or its currency changed,
 * so saving never drops the link silently.
 */
export function getSharedExpenseWalletOptions(
  wallets: readonly Wallet[],
  currency: CurrencyCode,
  selectedWalletId = "",
): Wallet[] {
  const active = getActiveWallets(wallets).filter(
    (wallet) => wallet.currency === currency,
  );
  const selected = wallets.find((wallet) => wallet.id === selectedWalletId);

  if (!selected || active.some((wallet) => wallet.id === selected.id)) {
    return active;
  }

  return [selected, ...active];
}

/**
 * Expense categories plus the deterministic "Gastos compartidos" option. The
 * synthetic option is added once, only while the document does not exist, and a
 * still-selected id that is gone keeps a fallback row so it stays visible.
 */
export function getSharedExpenseCategoryOptions(
  categories: readonly Category[],
  viewerUid: string,
  selectedCategoryId = "",
): SharedExpenseCategoryOption[] {
  const options: SharedExpenseCategoryOption[] = categories
    .filter((category) => category.type === "expense")
    .map((category) => ({
      id: category.id,
      label: category.name,
      icon: getCategoryIconName(category.icon),
    }));
  const sharedCategoryId =
    viewerUid.trim().length > 0 ? getSharedExpenseCategoryId(viewerUid) : "";

  if (options.some((option) => option.id === sharedCategoryId)) {
    return withSelectedFallback(options, selectedCategoryId);
  }

  if (sharedCategoryId.length > 0) {
    options.unshift({
      id: sharedCategoryId,
      label: "",
      labelKey: SHARED_EXPENSE_CATEGORY_LABEL_KEY,
      icon: getCategoryIconName("people-outline"),
    });
  }

  return withSelectedFallback(options, selectedCategoryId);
}

function withSelectedFallback(
  options: SharedExpenseCategoryOption[],
  selectedCategoryId: string,
): SharedExpenseCategoryOption[] {
  if (
    selectedCategoryId.length === 0 ||
    options.some((option) => option.id === selectedCategoryId)
  ) {
    return options;
  }

  return [
    ...options,
    {
      id: selectedCategoryId,
      label: "",
      labelKey: SHARED_EXPENSE_CATEGORY_FALLBACK_KEY,
      icon: "receipt-outline",
    },
  ];
}

/** Stored name or the translated label the synthetic options carry. */
export function getSharedExpenseCategoryLabel(
  option: SharedExpenseCategoryOption,
  t: Translate,
): string {
  return option.labelKey ? t(option.labelKey) : option.label;
}

/** Compact chips: the selected category always leads and stays visible. */
export function getSharedExpenseCategoryChips(
  options: readonly SharedExpenseCategoryOption[],
  selectedCategoryId: string,
  limit: number = SHARED_EXPENSE_CATEGORY_CHIP_LIMIT,
): SharedExpenseCategoryOption[] {
  const selected = options.find(
    (option) => option.id === selectedCategoryId,
  );
  const ordered = selected
    ? [selected, ...options.filter((option) => option.id !== selected.id)]
    : [...options];

  return ordered.slice(0, Math.max(0, limit));
}
