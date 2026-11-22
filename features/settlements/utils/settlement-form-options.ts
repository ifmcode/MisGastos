import type { Category } from "@/features/categories/types/category.types";
import {
  getCategoryIconName,
  type CategoryIcon,
} from "@/features/categories/utils/category-options";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import { getActiveWallets } from "@/features/wallets/utils/wallet-status";
import type { CurrencyCode } from "@/shared/constants/currencies";

export interface SettlementIncomeCategory {
  id: string;
  /** Stored name; empty when `unavailable` resolves the translated label. */
  name: string;
  icon: CategoryIcon;
  /** Alias of a default category migrated from the old local catalog. */
  legacyId?: string;
  /** The selected category no longer exists but must stay visible. */
  unavailable: boolean;
}

/**
 * Wallets the creditor can link: active ones of the settlement currency. A
 * wallet archived after the link stays in the list so saving never drops the
 * link silently and the form can warn about it.
 */
export function getSettlementWalletChoices(
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

/** Income categories of the linked movement, with a fallback for a stale id. */
export function getSettlementIncomeCategoryOptions(
  categories: readonly Category[],
  selectedCategoryId = "",
): SettlementIncomeCategory[] {
  const options = categories
    .filter((category) => category.type === "income")
    .map((category) => ({
      id: category.id,
      name: category.name,
      icon: getCategoryIconName(category.icon),
      ...(category.legacyId ? { legacyId: category.legacyId } : {}),
      unavailable: false,
    }));

  if (
    selectedCategoryId.length === 0 ||
    findSettlementIncomeCategoryOption(options, selectedCategoryId)
  ) {
    return options;
  }

  return [
    ...options,
    {
      id: selectedCategoryId,
      name: "",
      icon: "receipt-outline",
      unavailable: true,
    },
  ];
}

/**
 * Selected option by document id or legacy id, so an old default category
 * stays selected instead of becoming an unavailable row.
 */
export function findSettlementIncomeCategoryOption(
  options: readonly SettlementIncomeCategory[],
  selectedCategoryId: string,
): SettlementIncomeCategory | undefined {
  if (selectedCategoryId.length === 0) return undefined;

  return options.find(
    (option) =>
      option.id === selectedCategoryId ||
      option.legacyId === selectedCategoryId,
  );
}
