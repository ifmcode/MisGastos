import type { Friend } from "@/features/friends/types/friend.types";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import type { CurrencyCode } from "@/shared/constants/currencies";

import type { SharedExpense } from "../types/shared-expense.types";
import type { SharedExpenseFormValues } from "./shared-expense-form";
import { createSharedExpenseFormValues } from "./shared-expense-form";
import { fromSharedExpense } from "./shared-expense-form-from-expense";

export interface SharedExpenseInitialValuesOptions {
  editingExpense: SharedExpense | null;
  viewerUid: string;
  friends: readonly Friend[];
  lockedFriendUid?: string;
  /**
   * Create flows of a single friend prefill it; the movements menu passes
   * `false` so the friend field starts empty and stays required.
   */
  preselectFirstFriend?: boolean;
  preferredCurrency: CurrencyCode;
  today: string;
  wallets: readonly Wallet[];
  walletsLoading: boolean;
  walletsError: string | null;
  /**
   * Stored preference of the account for new expenses. An edited expense keeps
   * the state its own link implies, so the option is ignored on edit.
   */
  defaultRegisterInWallet: boolean;
}

/**
 * Initial form values of the create and edit flows. A stored wallet that no
 * longer exists (permanently deleted) is cleared, but never while the wallet
 * list is still loading or failed: that would drop a valid link silently.
 */
export function getSharedExpenseInitialValues({
  editingExpense,
  viewerUid,
  friends,
  lockedFriendUid,
  preselectFirstFriend = true,
  preferredCurrency,
  today,
  wallets,
  walletsLoading,
  walletsError,
  defaultRegisterInWallet,
}: SharedExpenseInitialValuesOptions): SharedExpenseFormValues {
  if (editingExpense) {
    const loaded = fromSharedExpense(editingExpense, viewerUid);
    const walletIsGone =
      loaded.walletId.length > 0 &&
      !walletsLoading &&
      walletsError === null &&
      !wallets.some((wallet) => wallet.id === loaded.walletId);

    return walletIsGone
      ? { ...loaded, walletId: "", categoryId: "" }
      : loaded;
  }

  const firstFriendUid = preselectFirstFriend ? friends[0]?.uid ?? "" : "";

  return createSharedExpenseFormValues({
    viewerUid,
    friendUid: lockedFriendUid ?? firstFriendUid,
    currency: preferredCurrency,
    date: today,
    payerId: viewerUid,
    registerInWallet: defaultRegisterInWallet,
  });
}
