import { useCallback } from "react";

import { useCategories } from "@/features/categories/hooks/use-categories";
import type { Category } from "@/features/categories/types/category.types";
import { useWallets } from "@/features/wallets/hooks/use-wallets";
import type { Wallet } from "@/features/wallets/types/wallet.types";

export interface GroupExpenseEditorResources {
  /** Owner wallets of the payer's linked movement. */
  wallets: Wallet[];
  /** Expense categories of the linked movement. */
  categories: Category[];
  walletsLoading: boolean;
  walletsError: string | null;
  /** Reloaded after a save: the wallet balance and the link changed. */
  refreshResources: () => void;
}

/**
 * Wallet and category collections the group-expense form needs. They live
 * together in one small hook so the editor body keeps its own composition.
 */
export function useGroupExpenseEditorResources(): GroupExpenseEditorResources {
  const walletsState = useWallets();
  const categoriesState = useCategories();

  const refreshResources = useCallback(() => {
    void walletsState.refresh();
    void categoriesState.refresh();
  }, [categoriesState.refresh, walletsState.refresh]);

  return {
    wallets: walletsState.wallets,
    categories: categoriesState.categories,
    walletsLoading: walletsState.loading,
    walletsError: walletsState.error,
    refreshResources,
  };
}
