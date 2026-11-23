import type { GroupSettlementFieldErrors } from "../schemas/group-settlement.schema";
import type { GroupSettlementInput } from "../types/group-settlement.types";
import type { GroupSettlementFormValues } from "../utils/group-settlement-form.types";

export type GroupSettlementAmountIssue =
  | "AMOUNT_REQUIRED"
  | "AMOUNT_INVALID"
  | "AMOUNT_EXCEEDS_DEBT";

export type GroupSettlementDateIssue = "DATE_INVALID" | "DATE_IN_FUTURE";

export interface UseGroupSettlementFormOptions {
  initialValues: GroupSettlementFormValues;
  /** Outstanding debt of the pair; the amount can never exceed it. */
  debtCents: number;
  viewerIsCreditor: boolean;
  /** Field errors of the last failed save, owned by the write hook. */
  fieldErrors: GroupSettlementFieldErrors;
  onSubmit: (input: GroupSettlementInput) => void;
}

export interface GroupSettlementFormController {
  values: GroupSettlementFormValues;
  errors: GroupSettlementFieldErrors;
  amountIssue: GroupSettlementAmountIssue | null;
  dateIssue: GroupSettlementDateIssue | null;
  /** Outstanding debt the amount is compared against. */
  boundCents: number;
  changeAmount: (amount: string) => void;
  selectDate: (isoDate: string) => void;
  changeNote: (note: string) => void;
  changeWallet: (walletId: string) => void;
  changeCategory: (categoryId: string) => void;
  submit: () => void;
}
