import { useCallback, useMemo } from "react";

import { useFriendsOverview } from "@/features/friends/hooks/use-friends-overview";
import type { Friend } from "@/features/friends/types/friend.types";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useSharedExpenseDeletion } from "@/features/shared-expenses/hooks/use-shared-expense-deletion";
import {
  useSharedExpenseEditor,
  type SharedExpenseEditorController,
} from "@/features/shared-expenses/hooks/use-shared-expense-editor";
import { useSharedExpenseList } from "@/features/shared-expenses/hooks/use-shared-expense-list";
import type { SharedExpense } from "@/features/shared-expenses/types/shared-expense.types";
import { findSharedExpenseForDetail } from "@/features/shared-expenses/utils/shared-expense-detail";
import type { SharedExpenseDetailLinkedMovement } from "@/features/shared-expenses/utils/shared-expense-detail.types";
import { useWallets } from "@/features/wallets/hooks/use-wallets";
import { useAuth } from "@/hooks/use-auth";
import { DEFAULT_CURRENCY } from "@/shared/constants/currencies";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

export type SharedExpenseDetailStatus = "loading" | "error" | "missing" | "ready";

export interface UseSharedExpenseDetailScreenOptions {
  /** Route id, already normalized to a single trimmed string. */
  expenseId: string;
}

export interface SharedExpenseDetailScreenController {
  status: SharedExpenseDetailStatus;
  /** Resolved on every render from the live list, never from a stored copy. */
  expense: SharedExpense | null;
  friends: Friend[];
  viewerUid: string;
  error: string | null;
  reload: () => void;
  /** True while the delete is in flight, so both header actions disable. */
  pending: boolean;
  mutationError: string | null;
  /** Bound to the current expense; resolves true when it was deleted. */
  deleteExpense: () => Promise<boolean>;
  editor: SharedExpenseEditorController;
  /** Wallet and movement of the payer's linked expense, resolved for display. */
  linkedMovement: SharedExpenseDetailLinkedMovement | null;
}

/**
 * Composition root of the shared-expense detail. The id only selects from the
 * viewer's participant-scoped list, so an unknown, deleted or non-participant
 * id resolves to null and the route shows the safe missing state.
 */
export function useSharedExpenseDetailScreen({
  expenseId,
}: UseSharedExpenseDetailScreenOptions): SharedExpenseDetailScreenController {
  const { user } = useAuth();
  const viewerUid = user?.uid;
  const { profile } = useProfile();
  const overview = useFriendsOverview({ viewerUid });
  const list = useSharedExpenseList({ viewerUid });
  const walletsState = useWallets();
  const { tr } = useScopedTranslation("sharedExpenses");

  const expense = useMemo(
    () => findSharedExpenseForDetail(list.expenses, expenseId),
    [expenseId, list.expenses],
  );

  // The linked movement belongs to the payer and is owner-only. The friend never
  // receives one, so the block only exists on the payer's own view; a deleted
  // wallet keeps a translated fallback name.
  const linkedMovement = useMemo<SharedExpenseDetailLinkedMovement | null>(() => {
    if (!expense?.walletId || expense.payerId !== viewerUid) return null;

    const wallet = walletsState.wallets.find(
      (item) => item.id === expense.walletId,
    );

    return {
      walletName: wallet?.name ?? tr("detail.walletUnavailable"),
      movementLabel: tr("detail.linkedMovementValue"),
    };
  }, [expense?.payerId, expense?.walletId, tr, viewerUid, walletsState.wallets]);

  // An edit must refresh the detail and the friend balances together.
  const refreshAll = useCallback(async () => {
    await Promise.all([list.refresh(), overview.refresh()]);
  }, [list.refresh, overview.refresh]);

  // After a delete the friend detail refreshes its own list and balances on
  // focus when we navigate back. Refreshing anything here would flash the
  // missing state or waste a request on an instance that is about to unmount.
  const onDeleted = useCallback(() => undefined, []);

  const editor = useSharedExpenseEditor({
    viewerUid,
    friends: overview.overview.friends,
    preferredCurrency: profile?.preferredCurrency ?? DEFAULT_CURRENCY,
    registerInWalletByDefault:
      profile?.registerSharedExpensesInWallet ?? false,
    onSaved: refreshAll,
  });

  const deletion = useSharedExpenseDeletion({
    viewerUid,
    onDeleted,
  });

  const deleteExpense = useCallback(
    () => (expense ? deletion.deleteExpense(expense) : Promise.resolve(false)),
    [deletion.deleteExpense, expense],
  );

  const status: SharedExpenseDetailStatus = expense
    ? "ready"
    : list.loading
      ? "loading"
      : list.error
        ? "error"
        : "missing";

  return {
    status,
    expense,
    friends: overview.overview.friends,
    viewerUid: viewerUid ?? "",
    error: list.error,
    reload: list.reload,
    pending: deletion.pendingId !== null,
    mutationError: deletion.actionError,
    deleteExpense,
    editor,
    linkedMovement,
  };
}
