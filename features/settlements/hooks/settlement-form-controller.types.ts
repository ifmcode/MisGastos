import type { SettlementFieldErrors } from "../schemas/settlement-validation.types";
import type { SettlementInput } from "../types/settlement.types";
import type {
  SettlementCurrencyOption,
  SettlementFormValues,
} from "../utils/settlement-form";
import type {
  SettlementAmountIssue,
  SettlementDateIssue,
} from "./settlement-form-issues";
import type { SettlementFormState } from "./use-settlement-form-state";

export interface UseSettlementFormOptions {
  initialValues: SettlementFormValues;
  options: readonly SettlementCurrencyOption[];
  /** Bound used when `options` has no entry for the selected currency. */
  debtCents: number;
  /** Fallback direction, used when `options` has no entry. */
  viewerIsCreditor: boolean;
  fieldErrors: SettlementFieldErrors;
  onSubmit: (input: SettlementInput) => void;
}

export interface SettlementFormController extends SettlementFormState {
  errors: SettlementFieldErrors;
  amountIssue: SettlementAmountIssue | null;
  dateIssue: SettlementDateIssue | null;
  changeAmount: (amount: string) => void;
  selectDate: (isoDate: string) => void;
  changeNote: (note: string) => void;
  changeWallet: (walletId: string) => void;
  changeCategory: (categoryId: string) => void;
  submit: () => void;
}

export type { SettlementAmountIssue, SettlementDateIssue };
