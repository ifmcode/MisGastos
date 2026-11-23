import { useCallback, useState } from "react";

import { getTodayIsoDate } from "@/shared/utils/date";

import type { GroupSettlementFieldErrors } from "../schemas/group-settlement.schema";
import {
  getGroupSettlementAmountIssue,
  getGroupSettlementDateIssue,
  selectGroupSettlementWallet,
  toGroupSettlementInput,
} from "../utils/group-settlement-form";
import type {
  GroupSettlementFormController,
  UseGroupSettlementFormOptions,
} from "./group-settlement-form-controller.types";

export type {
  GroupSettlementAmountIssue,
  GroupSettlementDateIssue,
  GroupSettlementFormController,
  UseGroupSettlementFormOptions,
} from "./group-settlement-form-controller.types";

/**
 * Draft values of the settlement form. It mounts once the pair is resolved, so
 * the currency and the direction never change while editing; only the amount,
 * the date, the note and the creditor's wallet link do.
 */
export function useGroupSettlementForm({
  initialValues,
  debtCents,
  viewerIsCreditor,
  fieldErrors,
  onSubmit,
}: UseGroupSettlementFormOptions): GroupSettlementFormController {
  const [values, setValues] = useState(initialValues);
  const [localErrors, setLocalErrors] = useState<GroupSettlementFieldErrors>(
    {},
  );
  const errors: GroupSettlementFieldErrors = { ...localErrors, ...fieldErrors };

  const clearErrors = useCallback(
    (...fields: (keyof GroupSettlementFieldErrors)[]) => {
      setLocalErrors((current) => {
        const found = fields.filter((field) => field in current);
        if (found.length === 0) return current;

        const next = { ...current };
        found.forEach((field) => delete next[field]);
        return next;
      });
    },
    [],
  );

  const changeAmount = useCallback(
    (amount: string) => {
      setValues((current) => ({ ...current, amount }));
      clearErrors("amount");
    },
    [clearErrors],
  );

  const selectDate = useCallback(
    (isoDate: string) => {
      setValues((current) => ({ ...current, date: isoDate }));
      clearErrors("date");
    },
    [clearErrors],
  );

  const changeNote = useCallback(
    (note: string) => {
      setValues((current) => ({ ...current, note }));
      clearErrors("note");
    },
    [clearErrors],
  );

  const changeWallet = useCallback(
    (walletId: string) => {
      setValues((current) => selectGroupSettlementWallet(current, walletId));
      clearErrors("walletId", "categoryId");
    },
    [clearErrors],
  );

  const changeCategory = useCallback(
    (categoryId: string) => {
      setValues((current) => ({ ...current, categoryId }));
      clearErrors("categoryId");
    },
    [clearErrors],
  );

  const amountIssue = getGroupSettlementAmountIssue(values, debtCents);
  const dateIssue = getGroupSettlementDateIssue(values, getTodayIsoDate());

  const submit = useCallback(() => {
    const currentDateIssue = getGroupSettlementDateIssue(
      values,
      getTodayIsoDate(),
    );
    if (currentDateIssue) {
      setLocalErrors((current) => ({ ...current, date: currentDateIssue }));
      return;
    }

    if (getGroupSettlementAmountIssue(values, debtCents)) return;

    onSubmit(toGroupSettlementInput(values, viewerIsCreditor));
  }, [debtCents, onSubmit, values, viewerIsCreditor]);

  return {
    values,
    errors,
    amountIssue,
    dateIssue,
    boundCents: debtCents,
    changeAmount,
    selectDate,
    changeNote,
    changeWallet,
    changeCategory,
    submit,
  };
}
