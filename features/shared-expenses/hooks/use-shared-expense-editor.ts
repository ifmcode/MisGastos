import { useCallback, useMemo, useState } from "react";

import { useCategories } from "@/features/categories/hooks/use-categories";
import type { Category } from "@/features/categories/types/category.types";
import type { Friend } from "@/features/friends/types/friend.types";
import { useWallets } from "@/features/wallets/hooks/use-wallets";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import type { CurrencyCode } from "@/shared/constants/currencies";
import { getTodayIsoDate } from "@/shared/utils/date";

import type { SharedExpenseFieldErrors } from "../schemas/shared-expense.schema";
import type {
  SharedExpense,
  SharedExpenseInput,
} from "../types/shared-expense.types";
import type { SharedExpenseFormValues } from "../utils/shared-expense-form";
import { getSharedExpenseInitialValues } from "../utils/shared-expense-form-load";
import { useSharedExpenseEditorSubmit } from "./use-shared-expense-editor-submit";

export interface UseSharedExpenseEditorOptions {
  viewerUid: string | undefined;
  friends: readonly Friend[];
  preferredCurrency: CurrencyCode;
  lockedFriendUid?: string;
  /** Prefill the first friend on create; the movements menu passes `false`. */
  preselectFirstFriend?: boolean;
  onSaved: () => void;
}

export interface SharedExpenseEditorController {
  formVisible: boolean;
  editingExpense: SharedExpense | null;
  initialValues: SharedExpenseFormValues;
  formError: string | null;
  fieldErrors: SharedExpenseFieldErrors;
  submitting: boolean;
  friendLocked: boolean;
  /** Owner wallets and expense categories of the linked movement. */
  wallets: Wallet[];
  categories: Category[];
  openCreate: () => void;
  openEdit: (expense: SharedExpense) => void;
  closeForm: () => void;
  submit: (input: SharedExpenseInput) => void;
}

/**
 * Create/edit orchestration of the page-sheet form and its error mapping. It
 * owns the wallet and category collections so both entry points (friend detail
 * and expense detail) mount one form contract without extra wiring.
 */
export function useSharedExpenseEditor({
  viewerUid,
  friends,
  preferredCurrency,
  lockedFriendUid,
  preselectFirstFriend,
  onSaved,
}: UseSharedExpenseEditorOptions): SharedExpenseEditorController {
  const walletsState = useWallets();
  const categoriesState = useCategories();
  const [formVisible, setFormVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<SharedExpense | null>(
    null,
  );

  const refreshResources = useCallback(() => {
    void walletsState.refresh();
    void categoriesState.refresh();
  }, [categoriesState.refresh, walletsState.refresh]);

  const handleSaved = useCallback(() => {
    setFormVisible(false);
    setEditingExpense(null);
    onSaved();
  }, [onSaved]);

  const submitState = useSharedExpenseEditorSubmit({
    viewerUid,
    editingExpense,
    onResourcesChanged: refreshResources,
    onSaved: handleSaved,
  });

  const initialValues = useMemo<SharedExpenseFormValues>(
    () =>
      getSharedExpenseInitialValues({
        editingExpense,
        viewerUid: viewerUid ?? "",
        friends,
        lockedFriendUid,
        preselectFirstFriend,
        preferredCurrency,
        today: getTodayIsoDate(),
        wallets: walletsState.wallets,
        walletsLoading: walletsState.loading,
        walletsError: walletsState.error,
      }),
    [
      editingExpense,
      friends,
      lockedFriendUid,
      preferredCurrency,
      preselectFirstFriend,
      viewerUid,
      walletsState.error,
      walletsState.loading,
      walletsState.wallets,
    ],
  );

  const openCreate = useCallback(() => {
    setEditingExpense(null);
    submitState.resetErrors();
    setFormVisible(true);
  }, [submitState.resetErrors]);

  const openEdit = useCallback(
    (expense: SharedExpense) => {
      setEditingExpense(expense);
      submitState.resetErrors();
      setFormVisible(true);
    },
    [submitState.resetErrors],
  );

  const closeForm = useCallback(() => {
    if (submitState.submitting) return;

    setFormVisible(false);
    setEditingExpense(null);
  }, [submitState.submitting]);

  return {
    formVisible,
    editingExpense,
    initialValues,
    formError: submitState.formError,
    fieldErrors: submitState.fieldErrors,
    submitting: submitState.submitting,
    friendLocked: (lockedFriendUid ?? "").trim().length > 0,
    wallets: walletsState.wallets,
    categories: categoriesState.categories,
    openCreate,
    openEdit,
    closeForm,
    submit: submitState.submit,
  };
}
