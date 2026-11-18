import { useRouter, type Href } from "expo-router";
import { useCallback, useMemo } from "react";

import { useCategories } from "@/features/categories/hooks/use-categories";
import type { Category } from "@/features/categories/types/category.types";
import { useFriendsOverview } from "@/features/friends/hooks/use-friends-overview";
import {
  findFriendByUid,
} from "@/features/friends/utils/friend-detail";
import { getFriendDisplayName } from "@/features/friends/utils/friend-display";
import { useWallets } from "@/features/wallets/hooks/use-wallets";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import { useAuth } from "@/hooks/use-auth";
import { getTodayIsoDate } from "@/shared/utils/date";

import type { SettlementFieldErrors } from "../schemas/settlement-validation.types";
import type { SettlementInput } from "../types/settlement.types";
import {
  createSettlementFormValues,
  getSettlementCurrencyOptions,
  type SettlementCurrencyOption,
  type SettlementFormValues,
} from "../utils/settlement-form";
import { useSettlementsWrite } from "./use-settlements-write";

export type SettlementCreateStatus =
  | "loading"
  | "error"
  | "missing"
  | "empty"
  | "ready";

export interface SettlementCreateScreenController {
  status: SettlementCreateStatus;
  friendName: string;
  options: SettlementCurrencyOption[];
  initialValues: SettlementFormValues | null;
  wallets: Wallet[];
  categories: Category[];
  /** Overview failure when there is no friend to show yet. */
  error: string | null;
  formError: string | null;
  fieldErrors: SettlementFieldErrors;
  submitting: boolean;
  reload: () => void;
  submit: (input: SettlementInput) => void;
  leave: () => void;
}

/**
 * Composition root of `/social/settlements/new`. The route only carries the
 * friend uid; the pair debt, the offered currencies and the creditor wallet are
 * resolved here, and the friend detail refreshes on focus after saving.
 */
export function useSettlementCreateScreen({
  friendUid,
}: {
  friendUid: string;
}): SettlementCreateScreenController {
  const router = useRouter();
  const { user } = useAuth();
  const viewerUid = user?.uid ?? "";
  const overview = useFriendsOverview({ viewerUid: user?.uid });
  const walletsState = useWallets();
  const categoriesState = useCategories();
  const write = useSettlementsWrite();

  const friend = useMemo(
    () => findFriendByUid(overview.overview.friends, friendUid),
    [friendUid, overview.overview.friends],
  );
  const options = useMemo(
    () => (friend ? getSettlementCurrencyOptions(friend.balances) : []),
    [friend],
  );
  const initialValues = useMemo(
    () =>
      friend
        ? createSettlementFormValues({
            viewerUid,
            friendUid: friend.uid,
            balances: friend.balances,
            today: getTodayIsoDate(),
          })
        : null,
    [friend, viewerUid],
  );

  const leave = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(
      (friendUid ? `/social/friends/${friendUid}` : "/(tabs)/social") as Href,
    );
  }, [friendUid, router]);

  const submit = useCallback(
    (input: SettlementInput) => {
      if (!viewerUid) return;

      void write.create(viewerUid, input).then((created) => {
        if (created) leave();
      });
    },
    [leave, viewerUid, write.create],
  );

  const status: SettlementCreateStatus = friend
    ? options.length === 0 || !initialValues
      ? "empty"
      : "ready"
    : overview.loading
      ? "loading"
      : overview.error
        ? "error"
        : "missing";

  return {
    status,
    friendName: friend ? getFriendDisplayName(friend) : "",
    options,
    initialValues,
    wallets: walletsState.wallets,
    categories: categoriesState.categories,
    error: overview.error,
    formError: write.actionError,
    fieldErrors: write.fieldErrors,
    submitting: write.submitting,
    reload: overview.reload,
    submit,
    leave,
  };
}
