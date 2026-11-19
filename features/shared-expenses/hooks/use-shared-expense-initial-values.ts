import { useMemo } from "react";

import type { Friend } from "@/features/friends/types/friend.types";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import type { CurrencyCode } from "@/shared/constants/currencies";
import { getTodayIsoDate } from "@/shared/utils/date";

import type { SharedExpense } from "../types/shared-expense.types";
import type { SharedExpenseFormValues } from "../utils/shared-expense-form";
import { getSharedExpenseInitialValues } from "../utils/shared-expense-form-load";

export interface UseSharedExpenseInitialValuesOptions {
  editingExpense: SharedExpense | null;
  viewerUid: string | undefined;
  friends: readonly Friend[];
  lockedFriendUid?: string;
  preselectFirstFriend?: boolean;
  preferredCurrency: CurrencyCode;
  registerInWalletByDefault: boolean;
  wallets: readonly Wallet[];
  walletsLoading: boolean;
  walletsError: string | null;
}

/**
 * Values of the create/edit form. It is rebuilt when the modal opens for
 * another expense, so the transient wallet toggle resets with the rest.
 */
export function useSharedExpenseInitialValues({
  editingExpense,
  viewerUid,
  friends,
  lockedFriendUid,
  preselectFirstFriend,
  preferredCurrency,
  registerInWalletByDefault,
  wallets,
  walletsLoading,
  walletsError,
}: UseSharedExpenseInitialValuesOptions): SharedExpenseFormValues {
  return useMemo(
    () =>
      getSharedExpenseInitialValues({
        editingExpense,
        viewerUid: viewerUid ?? "",
        friends,
        lockedFriendUid,
        preselectFirstFriend,
        preferredCurrency,
        today: getTodayIsoDate(),
        wallets,
        walletsLoading,
        walletsError,
        defaultRegisterInWallet: registerInWalletByDefault,
      }),
    [
      editingExpense,
      friends,
      lockedFriendUid,
      preferredCurrency,
      preselectFirstFriend,
      registerInWalletByDefault,
      viewerUid,
      walletsError,
      walletsLoading,
      wallets,
    ],
  );
}
