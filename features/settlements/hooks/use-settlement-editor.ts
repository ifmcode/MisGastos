import { useCallback, useMemo, useState } from "react";

import type { Friend } from "@/features/friends/types/friend.types";
import { getTodayIsoDate } from "@/shared/utils/date";

import type { SettlementFieldErrors } from "../schemas/settlement-validation.types";
import type { Settlement, SettlementInput } from "../types/settlement.types";
import {
  canEditSettlementAmount,
  getCurrencyNetBalanceCents,
} from "../utils/settlement-debt";
import {
  createSettlementEditFormValues,
  getSettlementCurrencyOptions,
  getSettlementEditableNetCents,
  type SettlementCurrencyOption,
  type SettlementFormValues,
} from "../utils/settlement-form";
import { useSettlementsWrite } from "./use-settlements-write";

export interface UseSettlementEditorOptions {
  viewerUid: string;
  settlement: Settlement | null;
  /** Balances of the pair; the edit bound excludes the settlement itself. */
  friend: Friend | null;
  /** Refreshes the list and the friend balances after a successful save. */
  onSaved: () => void;
}

export interface SettlementEditorController {
  visible: boolean;
  initialValues: SettlementFormValues | null;
  /** Single option with the editable bound, so the form has one bound source. */
  options: SettlementCurrencyOption[];
  debtCents: number;
  viewerIsCreditor: boolean;
  amountLocked: boolean;
  fieldErrors: SettlementFieldErrors;
  error: string | null;
  submitting: boolean;
  open: () => void;
  close: () => void;
  submit: (input: SettlementInput) => void;
}

/**
 * Edit modal of one settlement. The amount bound is the debt excluding this
 * settlement (`getSettlementEditableNetCents`), which is exactly what the
 * service validates, so a full settlement can still be resized up to the
 * original debt.
 */
export function useSettlementEditor({
  viewerUid,
  settlement,
  friend,
  onSaved,
}: UseSettlementEditorOptions): SettlementEditorController {
  const write = useSettlementsWrite();
  const [visible, setVisible] = useState(false);

  const currentNetCents = useMemo(
    () =>
      settlement && friend
        ? getCurrencyNetBalanceCents(friend.balances, settlement.currency)
        : 0,
    [friend, settlement],
  );
  const editableNetCents = useMemo(
    () =>
      settlement
        ? getSettlementEditableNetCents(
            settlement,
            viewerUid,
            currentNetCents,
          )
        : 0,
    [currentNetCents, settlement, viewerUid],
  );
  const options = useMemo(
    () =>
      settlement
        ? getSettlementCurrencyOptions([
            {
              currency: settlement.currency,
              netBalanceCents: editableNetCents,
            },
          ])
        : [],
    [editableNetCents, settlement],
  );
  const initialValues = useMemo(
    () =>
      settlement
        ? createSettlementEditFormValues({
            settlement,
            viewerUid,
            currentNetCents,
            today: getTodayIsoDate(),
          })
        : null,
    [currentNetCents, settlement, viewerUid],
  );

  const open = useCallback(() => {
    if (!settlement || !friend) return;

    write.resetErrors();
    setVisible(true);
  }, [friend, settlement, write.resetErrors]);

  const close = useCallback(() => {
    if (write.submitting) return;

    setVisible(false);
  }, [write.submitting]);

  const submit = useCallback(
    (input: SettlementInput) => {
      if (!settlement || !viewerUid) return;

      void write
        .update(viewerUid, settlement.id, input)
        .then((updated) => {
          if (!updated) return;

          setVisible(false);
          onSaved();
        });
    },
    [onSaved, settlement, viewerUid, write.update],
  );

  return {
    visible,
    initialValues,
    options,
    debtCents: Math.abs(editableNetCents),
    viewerIsCreditor: settlement ? settlement.toUserId === viewerUid : false,
    amountLocked: settlement
      ? !canEditSettlementAmount(settlement, viewerUid)
      : false,
    fieldErrors: write.fieldErrors,
    error: write.actionError,
    submitting: write.submitting,
    open,
    close,
    submit,
  };
}
