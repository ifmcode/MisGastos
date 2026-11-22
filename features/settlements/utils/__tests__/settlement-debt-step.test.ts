import { describe, expect, it } from "@jest/globals";

import type { SettlementCurrencyOption } from "../settlement-form.types";
import { resolveSettlementDebtStep } from "../settlement-debt-step";

const eur: SettlementCurrencyOption = {
  currency: "EUR",
  netBalanceCents: -1250,
  debtCents: 1250,
  direction: "viewer-owes-friend",
};

const usd: SettlementCurrencyOption = {
  currency: "USD",
  netBalanceCents: 400,
  debtCents: 400,
  direction: "friend-owes-viewer",
};

describe("resolveSettlementDebtStep", () => {
  it("returns empty when the pair has no debt currency", () => {
    expect(resolveSettlementDebtStep([], "")).toEqual({ kind: "empty" });
    expect(resolveSettlementDebtStep([], "EUR")).toEqual({ kind: "empty" });
    expect(resolveSettlementDebtStep([], "EUR", { stepShown: true })).toEqual({
      kind: "empty",
    });
  });

  it("opens the requested currency when it has debt", () => {
    expect(resolveSettlementDebtStep([eur], "EUR")).toEqual({
      kind: "ready",
      option: eur,
    });
    expect(resolveSettlementDebtStep([eur, usd], "USD")).toEqual({
      kind: "ready",
      option: usd,
    });
    expect(resolveSettlementDebtStep([eur, usd], "EUR")).toEqual({
      kind: "ready",
      option: eur,
    });
  });

  it("never opens another currency when the requested one has no debt", () => {
    expect(resolveSettlementDebtStep([eur], "USD")).toEqual({
      kind: "select",
    });
    expect(resolveSettlementDebtStep([eur, usd], "GBP")).toEqual({
      kind: "select",
    });
    expect(resolveSettlementDebtStep([usd], "EUR", { stepShown: true })).toEqual({
      kind: "select",
    });
  });

  it("skips the step with a single debt currency only when it was never shown", () => {
    expect(resolveSettlementDebtStep([eur], "")).toEqual({
      kind: "ready",
      option: eur,
    });
    expect(resolveSettlementDebtStep([eur], "", { stepShown: false })).toEqual({
      kind: "ready",
      option: eur,
    });
    expect(resolveSettlementDebtStep([eur], "", { stepShown: true })).toEqual({
      kind: "select",
    });
  });

  it("asks when two or more currencies have debt", () => {
    expect(resolveSettlementDebtStep([eur, usd], "")).toEqual({
      kind: "select",
    });
    expect(resolveSettlementDebtStep([eur, usd], "", { stepShown: true })).toEqual(
      { kind: "select" },
    );
  });
});
