import { useCallback, useMemo, useState } from "react";

import type { Friend } from "@/features/friends/types/friend.types";
import type { CurrencyCode } from "@/shared/constants/currencies";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";
import { getTodayIsoDate } from "@/shared/utils/date";

import type { SharedExpenseFieldErrors } from "../schemas/shared-expense.schema";
import {
  getSharedExpenseErrorCode,
  SharedExpenseValidationError,
} from "../services/shared-expense.errors";
import type {
  SharedExpense,
  SharedExpenseInput,
} from "../types/shared-expense.types";
import {
  createSharedExpenseFormValues,
  type SharedExpenseFormValues,
} from "../utils/shared-expense-form";
import { fromSharedExpense } from "../utils/shared-expense-form-load";
import { useSharedExpensesService } from "./use-shared-expenses-service";

export interface UseSharedExpenseEditorOptions {
  viewerUid: string | undefined;
  friends: readonly Friend[];
  preferredCurrency: CurrencyCode;
  onSaved: () => void;
}

export interface SharedExpenseEditorController {
  formVisible: boolean;
  editingExpense: SharedExpense | null;
  initialValues: SharedExpenseFormValues;
  formError: string | null;
  fieldErrors: SharedExpenseFieldErrors;
  submitting: boolean;
  openCreate: () => void;
  openEdit: (expense: SharedExpense) => void;
  closeForm: () => void;
  submit: (input: SharedExpenseInput) => void;
}

/** Create/edit orchestration of the page-sheet form and its error mapping. */
export function useSharedExpenseEditor({
  viewerUid,
  friends,
  preferredCurrency,
  onSaved,
}: UseSharedExpenseEditorOptions): SharedExpenseEditorController {
  const service = useSharedExpensesService();
  const { tr } = useScopedTranslation("sharedExpenses");
  const [formVisible, setFormVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<SharedExpense | null>(
    null,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<SharedExpenseFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const initialValues = useMemo<SharedExpenseFormValues>(() => {
    const viewer = viewerUid ?? "";

    if (editingExpense) return fromSharedExpense(editingExpense, viewer);

    return createSharedExpenseFormValues({
      viewerUid: viewer,
      friendUid: friends[0]?.uid ?? "",
      currency: preferredCurrency,
      date: getTodayIsoDate(),
      payerId: viewer,
    });
  }, [editingExpense, friends, preferredCurrency, viewerUid]);

  const openCreate = useCallback(() => {
    setEditingExpense(null);
    setFormError(null);
    setFieldErrors({});
    setFormVisible(true);
  }, []);

  const openEdit = useCallback((expense: SharedExpense) => {
    setEditingExpense(expense);
    setFormError(null);
    setFieldErrors({});
    setFormVisible(true);
  }, []);

  const closeForm = useCallback(() => {
    if (submitting) return;

    setFormVisible(false);
    setEditingExpense(null);
  }, [submitting]);

  const submit = useCallback(
    (input: SharedExpenseInput) => {
      if (!viewerUid) {
        setFormError(tr("errors.SIGN_IN_REQUIRED"));
        return;
      }

      const persist = async () => {
        setSubmitting(true);
        setFormError(null);
        setFieldErrors({});

        try {
          if (editingExpense) {
            await service.updateExpense(viewerUid, editingExpense.id, input);
          } else {
            await service.createExpense(viewerUid, input);
          }

          setFormVisible(false);
          setEditingExpense(null);
          onSaved();
        } catch (error: unknown) {
          if (error instanceof SharedExpenseValidationError) {
            setFieldErrors(error.fieldErrors);
          }
          setFormError(
            tr(`errors.${getSharedExpenseErrorCode(error, "SAVE_FAILED")}`),
          );
        } finally {
          setSubmitting(false);
        }
      };

      void persist();
    },
    [editingExpense, onSaved, service, tr, viewerUid],
  );

  return {
    formVisible,
    editingExpense,
    initialValues,
    formError,
    fieldErrors,
    submitting,
    openCreate,
    openEdit,
    closeForm,
    submit,
  };
}
