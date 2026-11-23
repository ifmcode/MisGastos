import { useCallback, useMemo } from "react";

import type { GroupDetail } from "@/features/groups/types/group.types";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useWallets } from "@/features/wallets/hooks/use-wallets";
import { useAuth } from "@/hooks/use-auth";
import { DEFAULT_CURRENCY } from "@/shared/constants/currencies";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { GroupExpense } from "../types/group-expense.types";
import type { GroupExpenseDetailLinkedMovement } from "../utils/group-expense-detail.types";
import { useGroupExpenseDeletion } from "./use-group-expense-deletion";
import { useGroupExpenseDetailLoad } from "./use-group-expense-detail-load";
import {
  useGroupExpenseEditor,
  type GroupExpenseEditorController,
} from "./use-group-expense-editor";

export type GroupExpenseDetailStatus =
  | "loading"
  | "error"
  | "missing"
  | "ready";

export interface UseGroupExpenseDetailScreenOptions {
  /** Route id, already normalized to a single trimmed string. */
  expenseId: string;
}

export interface GroupExpenseDetailScreenController {
  status: GroupExpenseDetailStatus;
  expense: GroupExpense | null;
  detail: GroupDetail | null;
  viewerUid: string;
  error: string | null;
  reload: () => void;
  /** True while the delete is in flight, so both header actions disable. */
  pending: boolean;
  mutationError: string | null;
  deleteExpense: () => Promise<boolean>;
  editor: GroupExpenseEditorController;
  /** Wallet and movement of the payer's linked expense, resolved for display. */
  linkedMovement: GroupExpenseDetailLinkedMovement | null;
}

/** Composition root of the group-expense detail: load, editor and deletion. */
export function useGroupExpenseDetailScreen({
  expenseId,
}: UseGroupExpenseDetailScreenOptions): GroupExpenseDetailScreenController {
  const { user } = useAuth();
  const viewerUid = user?.uid;
  const { profile } = useProfile();
  const walletsState = useWallets();
  const { tr } = useScopedTranslation("groupExpenses");
  const { expense, detail, loading, error, missing, reload } =
    useGroupExpenseDetailLoad({ expenseId });

  // The linked movement belongs to the payer and is owner-only, so a deleted
  // wallet keeps a translated fallback name instead of hiding the rows.
  const linkedMovement =
    useMemo<GroupExpenseDetailLinkedMovement | null>(() => {
      if (!expense?.walletId || expense.payerId !== viewerUid) return null;

      const wallet = walletsState.wallets.find(
        (item) => item.id === expense.walletId,
      );

      return {
        walletName: wallet?.name ?? tr("detail.walletUnavailable"),
        movementLabel: tr("detail.linkedMovementValue"),
      };
    }, [expense?.payerId, expense?.walletId, tr, viewerUid, walletsState.wallets]);

  const editor = useGroupExpenseEditor({
    viewerUid,
    groups: [],
    lockedDetail: detail,
    preferredCurrency: profile?.preferredCurrency ?? DEFAULT_CURRENCY,
    registerInWalletByDefault:
      profile?.registerSharedExpensesInWallet ?? false,
    onSaved: reload,
  });

  // The detail closes right after a successful delete, so the caller only needs
  // the boolean; refreshing here would flash the missing state.
  const deletion = useGroupExpenseDeletion({
    viewerUid,
    onDeleted: () => undefined,
  });

  const deleteExpense = useCallback(
    () => (expense ? deletion.deleteExpense(expense) : Promise.resolve(false)),
    [deletion.deleteExpense, expense],
  );

  const status: GroupExpenseDetailStatus =
    expense && detail
      ? "ready"
      : missing
        ? "missing"
        : loading
          ? "loading"
          : error
            ? "error"
            : "missing";

  return {
    status,
    expense,
    detail,
    viewerUid: viewerUid ?? "",
    error,
    reload,
    pending: deletion.pendingId !== null,
    mutationError: deletion.actionError,
    deleteExpense,
    editor,
    linkedMovement,
  };
}
