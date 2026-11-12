import { TransactionCategory } from "./transaction-options";

/** Maximum number of category chips shown inline before the `+` action. */
export const COMPACT_CATEGORY_LIMIT = 3;

export interface TransactionCategoryChips {
  /** Chips rendered inline. The selected category always leads the list. */
  visible: readonly TransactionCategory[];
  /** Categories that only appear inside the picker popup. */
  hidden: readonly TransactionCategory[];
}

/**
 * Builds the compact category chips. The selected category moves to the front
 * so it stays visible even when the collection is longer than the limit.
 */
export function getTransactionCategoryChips(
  categories: readonly TransactionCategory[],
  selectedId: string,
  limit: number = COMPACT_CATEGORY_LIMIT,
): TransactionCategoryChips {
  const selected = categories.find((category) => category.id === selectedId);
  const ordered = selected
    ? [
        selected,
        ...categories.filter((category) => category.id !== selected.id),
      ]
    : [...categories];
  const visibleLimit = Math.max(0, limit);

  return {
    visible: ordered.slice(0, visibleLimit),
    hidden: ordered.slice(visibleLimit),
  };
}
