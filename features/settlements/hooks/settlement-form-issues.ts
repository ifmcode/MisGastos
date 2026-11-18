import type { getSettlementAmountIssue, getSettlementDateIssue } from "../utils/settlement-form";

export type SettlementAmountIssue = NonNullable<
  ReturnType<typeof getSettlementAmountIssue>
>;

export type SettlementDateIssue = NonNullable<
  ReturnType<typeof getSettlementDateIssue>
>;
