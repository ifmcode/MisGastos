import { useRouter, type Href } from "expo-router";
import { useCallback, useMemo } from "react";

import { useCategories } from "@/features/categories/hooks/use-categories";
import { useFriendsOverview } from "@/features/friends/hooks/use-friends-overview";
import { findFriendByUid } from "@/features/friends/utils/friend-detail";
import { getFriendDisplayName } from "@/features/friends/utils/friend-display";
import { useWallets } from "@/features/wallets/hooks/use-wallets";
import { useAuth } from "@/hooks/use-auth";
import { getTodayIsoDate } from "@/shared/utils/date";

import type { SettlementInput } from "../types/settlement.types";
import {
  createSettlementFormValues,
  getSettlementCurrencyOptions,
} from "../utils/settlement-form";
import type {
  SettlementCreateScreenController,
  SettlementCreateStatus,
  UseSettlementCreateScreenOptions,
} from "./settlement-create-screen.types";
import { useSettlementDebtSelection } from "./use-settlement-debt-selection";
import { useSettlementsWrite } from "./use-settlements-write";

export type {
  SettlementCreateScreenController,
  SettlementCreateStatus,
  UseSettlementCreateScreenOptions,
} from "./settlement-create-screen.types";

/**
 * Composition root of `/social/settlements/new`. The route carries the friend
 * uid and an optional currency; the pair debt, the debt-step decision, the
 * initial values and the creditor wallet are resolved here, and the friend
 * detail refreshes on focus after saving.
 */
export function useSettlementCreateScreen({
  friendUid,
  currency,
}: UseSettlementCreateScreenOptions): SettlementCreateScreenController {
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
  const step = useSettlementDebtSelection({ friendUid, currency, options });
  const { decision } = step;
  const initialValues = useMemo(
    () =>
      friend && decision.kind === "ready"
        ? createSettlementFormValues({
            viewerUid,
            friendUid: friend.uid,
            currency: decision.option.currency,
            balances: friend.balances,
            today: getTodayIsoDate(),
          })
        : null,
    [decision, friend, viewerUid],
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
    ? decision.kind === "empty"
      ? "empty"
      : decision.kind === "select"
        ? "select"
        : initialValues
          ? "ready"
          : "empty"
    : overview.loading
      ? "loading"
      : overview.error
        ? "error"
        : "missing";

  return {
    status,
    friendName: friend ? getFriendDisplayName(friend) : "",
    options,
    selectedOption: step.selectedOption,
    initialValues,
    wallets: walletsState.wallets,
    categories: categoriesState.categories,
    error: overview.error,
    formError: write.actionError,
    fieldErrors: write.fieldErrors,
    submitting: write.submitting,
    debtDisappeared: step.debtDisappeared,
    reload: overview.reload,
    submit,
    selectCurrency: step.selectCurrency,
    leave,
  };
}
