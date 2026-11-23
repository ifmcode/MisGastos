import { useCallback } from "react";

import { useCategories } from "@/features/categories/hooks/use-categories";
import { useWallets } from "@/features/wallets/hooks/use-wallets";
import { useAuth } from "@/hooks/use-auth";

import type { GroupSettlementInput } from "../types/group-settlement.types";
import type {
  GroupSettlementScreenController,
  GroupSettlementScreenStatus,
  UseGroupSettlementScreenOptions,
} from "./group-settlement-screen.types";
import { useGroupExpenseCloseNavigation } from "./use-group-expense-close-navigation";
import { useGroupSettlementLoad } from "./use-group-settlement-load";
import { useGroupSettlementSelect } from "./use-group-settlement-select";
import { useGroupSettlementTarget } from "./use-group-settlement-target";
import { useGroupSettlementWrite } from "./use-group-settlement-write";

export type {
  GroupSettlementScreenController,
  GroupSettlementScreenStatus,
  UseGroupSettlementScreenOptions,
} from "./group-settlement-screen.types";

/** True when the route already carries the pair and currency of the form. */
function hasPairParams(
  currency: string,
  fromUserId: string,
  toUserId: string,
): boolean {
  return [currency, fromUserId, toUserId].some(
    (value) => value.trim().length > 0,
  );
}

/**
 * Composition root of `/social/groups/[groupId]/settle`. Create and edit share
 * it; without a pair the create route opens the debt step and lets the viewer
 * choose which pair to settle.
 */
export function useGroupSettlementScreen({
  groupId,
  settlementId,
  currency,
  fromUserId,
  toUserId,
}: UseGroupSettlementScreenOptions): GroupSettlementScreenController {
  const { user } = useAuth();
  const viewerUid = user?.uid ?? "";
  const isEditing = settlementId.trim().length > 0;
  const selectsDebt =
    !isEditing && !hasPairParams(currency, fromUserId, toUserId);
  const load = useGroupSettlementLoad({
    viewerUid: user?.uid,
    groupId,
    settlementId,
  });
  const walletsState = useWallets();
  const categoriesState = useCategories();
  const write = useGroupSettlementWrite();
  const { settlement, detail } = load;
  const target = useGroupSettlementTarget({
    viewerUid,
    groupId,
    settlement,
    balances: load.balances,
    detail,
    currency,
    fromUserId,
    toUserId,
  });
  const debts = load.balances?.debts ?? [];

  const leave = useGroupExpenseCloseNavigation({
    groupId: settlement?.groupId ?? detail?.group.id ?? groupId,
  });
  const selectDebt = useGroupSettlementSelect({
    groupId: detail?.group.id ?? groupId,
  });

  const submit = useCallback(
    (input: GroupSettlementInput) => {
      if (!viewerUid) return;

      const mutation = settlement
        ? write.update(viewerUid, settlement.id, input)
        : write.create(viewerUid, input);

      void mutation.then((saved) => {
        if (saved) leave();
      });
    },
    [leave, settlement, viewerUid, write.create, write.update],
  );

  const status: GroupSettlementScreenStatus =
    load.status !== "ready"
      ? load.status
      : settlement
        ? "ready"
        : selectsDebt
          ? debts.length > 0
            ? "select"
            : "no-debt"
          : !target.debt
            ? "no-debt"
            : target.direction
              ? "ready"
              : "missing";

  return {
    status,
    isEditing,
    detail,
    settlement,
    debt: target.debt,
    direction: target.direction,
    boundCents: target.boundCents,
    groupName: target.groupName,
    fromName: target.fromName,
    toName: target.toName,
    viewerUid,
    viewerIsCreditor: target.viewerIsCreditor,
    amountLocked: target.amountLocked,
    initialValues: target.initialValues,
    debts,
    simplifyDebts:
      load.balances?.simplifyDebts ?? detail?.group.simplifyDebts ?? true,
    selectDebt,
    wallets: walletsState.wallets,
    categories: categoriesState.categories,
    fieldErrors: write.fieldErrors,
    formError: write.actionError,
    submitting: write.submitting,
    error: load.error,
    reload: load.reload,
    leave,
    submit,
  };
}
