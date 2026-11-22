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

/** Label of a still-selected id whose category is no longer stored. */
export const SHARED_EXPENSE_CATEGORY_FALLBACK_KEY = "form.categoryUnavailable";

export interface SharedExpenseCategoryOption {
  id: string;
  /** Stored name; empty when `labelKey` resolves the translated label. */
  label: string;
  labelKey?: string;
  icon: CategoryIcon;
  /** Alias of a default category migrated from the old local catalog. */
  legacyId?: string;
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
 * Expense categories of the linked movement. The deterministic "Gastos
 * compartidos" category is never offered, whether it is stored or would be
 * synthetic: the movement is already the shared expense, so it adds no choice.
 * A still-selected id that is gone keeps a fallback row so it stays visible.
 */
export function getSharedExpenseCategoryOptions(
  categories: readonly Category[],
  viewerUid: string,
  selectedCategoryId = "",
): SharedExpenseCategoryOption[] {
  const sharedCategoryId =
    viewerUid.trim().length > 0 ? getSharedExpenseCategoryId(viewerUid) : "";
  const options: SharedExpenseCategoryOption[] = categories
    .filter(
      (category) =>
        category.type === "expense" && category.id !== sharedCategoryId,
    )
    .map((category) => ({
      id: category.id,
      label: category.name,
      icon: getCategoryIconName(category.icon),
      ...(category.legacyId ? { legacyId: category.legacyId } : {}),
    }));

  return withSelectedFallback(
    options,
    // A legacy selection of the shared category must not come back as a
    // fallback row: the picker never offers it.
    selectedCategoryId === sharedCategoryId ? "" : selectedCategoryId,
  );
}

function withSelectedFallback(
  options: SharedExpenseCategoryOption[],
  selectedCategoryId: string,
): SharedExpenseCategoryOption[] {
  if (
    selectedCategoryId.length === 0 ||
    findSharedExpenseCategoryOption(options, selectedCategoryId)
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

/**
 * Selected option by document id or legacy id, which keeps an old default
 * category selected instead of turning it into an unavailable row.
 */
export function findSharedExpenseCategoryOption(
  options: readonly SharedExpenseCategoryOption[],
  selectedCategoryId: string,
): SharedExpenseCategoryOption | undefined {
  if (selectedCategoryId.length === 0) return undefined;

  return options.find(
    (option) =>
      option.id === selectedCategoryId ||
      option.legacyId === selectedCategoryId,
  );
}

/** Stored name or the translated label the synthetic options carry. */
export function getSharedExpenseCategoryLabel(
  option: SharedExpenseCategoryOption,
  t: Translate,
): string {
  return option.labelKey ? t(option.labelKey) : option.label;
}
