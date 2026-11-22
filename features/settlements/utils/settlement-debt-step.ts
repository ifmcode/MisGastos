import type { SettlementCurrencyOption } from "./settlement-form.types";

export type SettlementDebtStepDecision =
  | { kind: "ready"; option: SettlementCurrencyOption }
  | { kind: "select" }
  | { kind: "empty" };

export interface SettlementDebtStepOptions {
  /** True when this screen instance already rendered the step. */
  stepShown?: boolean;
}

/**
 * Decides between the settlement form and the debt-selection step:
 * - a `currency` param that matches a currency with debt opens that form;
 * - a non-empty param without a match never opens another currency: it asks
 *   when there is debt left and reports empty when there is none;
 * - no param and no debt currency means there is nothing to settle;
 * - no param after the step was shown asks again, so a pair that dropped to a
 *   single currency is not promoted to its form;
 * - no param, step never shown and a single debt currency skips the step;
 * - anything else asks.
 *
 * `currencyParam` is the route param already normalized, or an empty string.
 */
export function resolveSettlementDebtStep(
  options: readonly SettlementCurrencyOption[],
  currencyParam: string,
  { stepShown = false }: SettlementDebtStepOptions = {},
): SettlementDebtStepDecision {
  const requested = options.find(
    (option) => option.currency === currencyParam,
  );

  if (requested) return { kind: "ready", option: requested };

  if (currencyParam.length > 0) {
    return options.length === 0 ? { kind: "empty" } : { kind: "select" };
  }

  if (options.length === 0) return { kind: "empty" };
  if (stepShown) return { kind: "select" };
  if (options.length === 1) return { kind: "ready", option: options[0] };

  return { kind: "select" };
}
