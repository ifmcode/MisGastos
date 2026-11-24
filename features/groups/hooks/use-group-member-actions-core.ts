import { useCallback, useRef, useState } from "react";

import { centsToAmount } from "@/features/friends/utils/friend-balance";
import type { GroupBalances } from "@/features/group-expenses/types/group-balance.types";
import type { CurrencyCode } from "@/shared/constants/currencies";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useConfirmDialog } from "@/shared/hooks/use-confirm-dialog";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getGroupErrorCode } from "../services/group.errors";
import { getMemberOutstandingBalances } from "../utils/group-member-balances";
import {
  getBlockedBalanceDialogCopy,
  type BlockedBalanceVariant,
} from "../utils/group-membership-copy";
import type {
  GroupMemberActionsCore,
  GroupMemberPendingAction,
} from "./use-group-member-actions.types";

export interface UseGroupMemberActionsCoreOptions {
  viewerUid: string | undefined;
  isOwner: boolean;
  balances: GroupBalances | null;
  /** Opens the settle route from the blocked-balance dialog. */
  onOpenSettle?: () => void;
}

/**
 * Shared machinery of the membership actions: one in-flight operation at a
 * time, its error banner, and the pre-check that stops a remove or leave when
 * the already-loaded nets say the member still owes or is owed.
 */
export function useGroupMemberActionsCore({
  viewerUid,
  isOwner,
  balances,
  onOpenSettle,
}: UseGroupMemberActionsCoreOptions): GroupMemberActionsCore {
  const locale = useAppLocale();
  const { tr } = useScopedTranslation("groups");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] =
    useState<GroupMemberPendingAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const blockedDialog = useConfirmDialog();
  const inFlightRef = useRef(false);

  const run = useCallback(
    async (
      id: string,
      action: GroupMemberPendingAction,
      fallback: "SAVE_FAILED" | "DELETE_FAILED",
      operation: (viewer: string) => Promise<unknown>,
      after: () => void | Promise<void>,
    ) => {
      if (!viewerUid || inFlightRef.current) return;

      inFlightRef.current = true;
      setPendingId(id);
      setPendingAction(action);
      setError(null);

      try {
        await operation(viewerUid);
        await after();
      } catch (actionError: unknown) {
        setError(tr(`errors.${getGroupErrorCode(actionError, fallback)}`));
      } finally {
        inFlightRef.current = false;
        setPendingId(null);
        setPendingAction(null);
      }
    },
    [tr, viewerUid],
  );

  const formatAmount = useCallback(
    (netCents: number, currency: CurrencyCode) =>
      locale.formatCurrency(centsToAmount(netCents), currency),
    [locale],
  );

  const checkBlocked = useCallback(
    (memberId: string, variant: BlockedBalanceVariant, name?: string) => {
      const outstanding = getMemberOutstandingBalances(balances, memberId);
      if (outstanding.length === 0) return false;

      blockedDialog.open({
        ...getBlockedBalanceDialogCopy(
          { variant, name, balances: outstanding, formatAmount },
          tr,
        ),
        onConfirm: () => onOpenSettle?.(),
      });

      return true;
    },
    [balances, blockedDialog, formatAmount, onOpenSettle, tr],
  );

  return {
    pendingId,
    pendingAction,
    error,
    blockedDialog,
    canLeave: !isOwner,
    checkBlocked,
    run,
  };
}
