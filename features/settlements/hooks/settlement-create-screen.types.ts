import type { Category } from "@/features/categories/types/category.types";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import type { CurrencyCode } from "@/shared/constants/currencies";

import type { SettlementFieldErrors } from "../schemas/settlement-validation.types";
import type { SettlementInput } from "../types/settlement.types";
import type {
  SettlementCurrencyOption,
  SettlementFormValues,
} from "../utils/settlement-form";

export type SettlementCreateStatus =
  | "loading"
  | "error"
  | "missing"
  | "empty"
  | "select"
  | "ready";

export interface UseSettlementCreateScreenOptions {
  /** Route friend uid, already normalized by the route. */
  friendUid: string;
  /** Optional `currency` route param, already normalized; empty when absent. */
  currency: string;
}

export interface SettlementCreateScreenController {
  status: SettlementCreateStatus;
  friendName: string;
  options: SettlementCurrencyOption[];
  /** Debt currency resolved by the step; only set when `status` is `ready`. */
  selectedOption: SettlementCurrencyOption | null;
  initialValues: SettlementFormValues | null;
  wallets: Wallet[];
  categories: Category[];
  /** Overview failure when there is no friend to show yet. */
  error: string | null;
  formError: string | null;
  fieldErrors: SettlementFieldErrors;
  submitting: boolean;
  /** True when the step was shown and the pair no longer owes anything. */
  debtDisappeared: boolean;
  reload: () => void;
  submit: (input: SettlementInput) => void;
  /** Pushes the same route with the chosen currency; must not replace. */
  selectCurrency: (currency: CurrencyCode) => void;
  leave: () => void;
}
