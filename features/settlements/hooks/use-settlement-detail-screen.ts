import { useCallback, useMemo } from "react";

import { useCategories } from "@/features/categories/hooks/use-categories";
import type { Category } from "@/features/categories/types/category.types";
import { useFriendsOverview } from "@/features/friends/hooks/use-friends-overview";
import type { Friend } from "@/features/friends/types/friend.types";
import { findFriendByUid } from "@/features/friends/utils/friend-detail";
import { getFriendDisplayName } from "@/features/friends/utils/friend-display";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useWallets } from "@/features/wallets/hooks/use-wallets";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import { useAuth } from "@/hooks/use-auth";

import type { Settlement } from "../types/settlement.types";
import {
  buildSettlementViewerDetail,
  getSettlementDetailStatus,
  type SettlementDetailStatus,
  type SettlementViewerDetail,
} from "../utils/settlement-detail";
import {
  useSettlementDeletion,
  type SettlementDeletionController,
} from "./use-settlement-deletion";
import {
  useSettlementEditor,
  type SettlementEditorController,
} from "./use-settlement-editor";
import {
  useSettlementWalletInfo,
  type SettlementWalletInfo,
} from "./use-settlement-wallet-info";
import {
  useSettlementWalletLink,
  type SettlementWalletLinkController,
} from "./use-settlement-wallet-link";
import { useSettlementsList } from "./use-settlements-list";

export interface SettlementDetailScreenController {
  status: SettlementDetailStatus;
  settlement: Settlement | null;
  detail: SettlementViewerDetail | null;
  friend: Friend | null;
  friendName: string;
  viewerUid: string;
  viewerName: string;
  error: string | null;
  reload: () => void;
  pending: boolean;
  mutationError: string | null;
  deletion: SettlementDeletionController;
  editor: SettlementEditorController;
  walletLink: SettlementWalletLinkController;
  friendWallets: Wallet[];
  categories: Category[];
  walletInfo: SettlementWalletInfo;
}

/**
 * Composition root of the settlement detail. The id only selects from the
 * viewer's participant-scoped list, so an unknown or deleted id resolves to the
 * safe missing state. Delete leaves without refreshing: the friend detail
 * reloads its own list and balances on focus.
 */
export function useSettlementDetailScreen({
  settlementId,
}: {
  settlementId: string;
}): SettlementDetailScreenController {
  const { user } = useAuth();
  const viewerUid = user?.uid ?? "";
  const { profile } = useProfile();
  const overview = useFriendsOverview({ viewerUid: user?.uid });
  const list = useSettlementsList({ viewerUid: user?.uid });
  const walletsState = useWallets();
  const categoriesState = useCategories();

  const settlement = useMemo(
    () => list.settlements.find((item) => item.id === settlementId) ?? null,
    [list.settlements, settlementId],
  );
  const detail = useMemo(
    () => (settlement ? buildSettlementViewerDetail(settlement, viewerUid) : null),
    [settlement, viewerUid],
  );
  const friend = useMemo(
    () =>
      detail
        ? findFriendByUid(overview.overview.friends, detail.friendUid)
        : null,
    [detail, overview.overview.friends],
  );
  const walletInfo = useSettlementWalletInfo(settlement, walletsState.wallets);

  const refreshAll = useCallback(async () => {
    await Promise.all([list.refresh(), overview.refresh()]);
  }, [list.refresh, overview.refresh]);

  const editor = useSettlementEditor({
    viewerUid,
    settlement,
    friend,
    onSaved: () => {
      void refreshAll();
    },
  });
  const walletLink = useSettlementWalletLink({
    viewerUid,
    settlement,
    onChanged: () => {
      void refreshAll();
    },
  });
  const deletion = useSettlementDeletion({ viewerUid });

  const reload = useCallback(() => {
    list.reload();
    void overview.reload();
  }, [list.reload, overview.reload]);

  const status = getSettlementDetailStatus({
    settlement,
    detail,
    loading: list.loading,
    error: list.error,
  });

  return {
    status,
    settlement,
    detail,
    friend,
    friendName: friend
      ? getFriendDisplayName(friend)
      : (detail?.friendUid ?? ""),
    viewerUid,
    viewerName:
      profile?.displayName?.trim() || profile?.email || user?.email || "",
    error: list.error,
    reload,
    pending: deletion.pending || editor.submitting || walletLink.pending,
    mutationError: deletion.error ?? walletLink.error,
    deletion,
    editor,
    walletLink,
    friendWallets: walletsState.wallets,
    categories: categoriesState.categories,
    walletInfo,
  };
}
