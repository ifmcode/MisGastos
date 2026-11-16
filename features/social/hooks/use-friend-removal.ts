import { useRouter, type Href } from "expo-router";
import { useCallback } from "react";

import { useFriendActions } from "@/features/friends/hooks/use-friend-actions";
import type { Friend } from "@/features/friends/types/friend.types";
import { getFriendDisplayName } from "@/features/friends/utils/friend-display";
import {
  useConfirmDialog,
  type UseConfirmDialogResult,
} from "@/shared/hooks/use-confirm-dialog";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

export interface UseFriendRemovalOptions {
  viewerUid: string | undefined;
  friend: Friend | null;
  /** Reloads the overview after a successful removal. */
  onChanged: () => void | Promise<void>;
}

export interface FriendRemovalController {
  /** True while any friend action is in flight. */
  busy: boolean;
  /** True while this friend is the one being removed. */
  removing: boolean;
  error: string | null;
  requestRemove: () => void;
  confirm: UseConfirmDialogResult;
}

/**
 * Removes the current friend and returns to the previous screen. The
 * confirmation copy is the same one the tab used before TICKET-042.
 */
export function useFriendRemoval({
  viewerUid,
  friend,
  onChanged,
}: UseFriendRemovalOptions): FriendRemovalController {
  const router = useRouter();
  const { t } = useScopedTranslation("friends");
  const actions = useFriendActions({ viewerUid, onChanged });
  const confirm = useConfirmDialog();
  const { open } = confirm;
  const { removeFriend } = actions;
  const uid = friend?.uid ?? "";

  const leave = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/social" as Href);
  }, [router]);

  const remove = useCallback(async () => {
    const removed = await removeFriend(uid);
    if (removed) leave();
  }, [leave, removeFriend, uid]);

  const requestRemove = useCallback(() => {
    if (!friend) return;

    open({
      title: t("removeDialog.title"),
      message: t("removeDialog.message", {
        name: getFriendDisplayName(friend),
      }),
      confirmLabel: t("removeDialog.confirm"),
      cancelLabel: t("removeDialog.cancel"),
      onConfirm: () => {
        void remove();
      },
    });
  }, [friend, open, remove, t]);

  return {
    busy: actions.pendingId !== null,
    removing: actions.pendingId === uid,
    error: actions.error,
    requestRemove,
    confirm,
  };
}
