import { useFocusEffect, useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { CurrencyCode } from "@/shared/constants/currencies";

import {
  resolveSettlementDebtStep,
  type SettlementCurrencyOption,
} from "../utils/settlement-form";
import type {
  SettlementDebtSelection,
  UseSettlementDebtSelectionOptions,
} from "./use-settlement-debt-selection.types";

export type {
  SettlementDebtSelection,
  UseSettlementDebtSelectionOptions,
} from "./use-settlement-debt-selection.types";

function buildSettlementHref(
  friendUid: string,
  currency: CurrencyCode,
): Href {
  const uid = encodeURIComponent(friendUid);
  const code = encodeURIComponent(currency);

  return `/social/settlements/new?friendUid=${uid}&currency=${code}` as Href;
}

/**
 * Debt-step decision of `/social/settlements/new`. Choosing a currency pushes
 * the same route with `currency=<code>` instead of replacing it, so back returns
 * to the step and the step's back returns to the friend detail. Once the step
 * was rendered it is never skipped again, so the pair dropping to a single
 * currency never changes the currency of an open form.
 */
export function useSettlementDebtSelection({
  friendUid,
  currency,
  options,
}: UseSettlementDebtSelectionOptions): SettlementDebtSelection {
  const router = useRouter();
  const [stepShown, setStepShown] = useState(false);
  const pushingRef = useRef(false);
  const decision = useMemo(
    () => resolveSettlementDebtStep(options, currency, { stepShown }),
    [currency, options, stepShown],
  );

  useEffect(() => {
    if (decision.kind === "select") setStepShown(true);
  }, [decision.kind]);

  useFocusEffect(
    useCallback(() => {
      pushingRef.current = false;
    }, []),
  );

  const selectCurrency = useCallback(
    (next: CurrencyCode) => {
      if (!friendUid || pushingRef.current) return;

      pushingRef.current = true;
      router.push(buildSettlementHref(friendUid, next));
    },
    [friendUid, router],
  );

  return {
    decision,
    selectedOption: decision.kind === "ready" ? decision.option : null,
    debtDisappeared: stepShown && decision.kind === "empty",
    selectCurrency,
  };
}
