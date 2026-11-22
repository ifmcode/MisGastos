import type { CurrencyCode } from "@/shared/constants/currencies";

import type { SettlementDebtStepDecision } from "../utils/settlement-debt-step";
import type { SettlementCurrencyOption } from "../utils/settlement-form";

export interface UseSettlementDebtSelectionOptions {
  /** Route friend uid, already normalized by the route. */
  friendUid: string;
  /** Optional `currency` route param, already normalized; empty when absent. */
  currency: string;
  /** Debt currencies of the pair, in `Friend.balances[]` order. */
  options: readonly SettlementCurrencyOption[];
}

export interface SettlementDebtSelection {
  decision: SettlementDebtStepDecision;
  /** Debt currency chosen by the step; `null` while it asks or is empty. */
  selectedOption: SettlementCurrencyOption | null;
  /** True when the step was shown and the pair no longer owes anything. */
  debtDisappeared: boolean;
  /**
   * Pushes the chosen currency so back returns to the step. Repeated calls
   * before the new screen takes focus are ignored, so a double tap cannot stack
   * two forms.
   */
  selectCurrency: (currency: CurrencyCode) => void;
}
