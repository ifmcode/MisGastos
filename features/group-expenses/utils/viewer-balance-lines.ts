import { centsToAmount } from "@/features/friends/utils/friend-balance";
import type { CurrencyCode } from "@/shared/constants/currencies";

import type { ViewerGroupBalance } from "../types/group-balance.types";

/** Already-resolved copy: each feature keeps its own translation namespace. */
export interface ViewerBalanceCopy {
  owedToYou: (amount: string) => string;
  youOwe: (amount: string) => string;
}

export type ViewerBalanceDirection = "owed-to-viewer" | "viewer-owes";

/** One renderable line of the viewer's position, already formatted. */
export interface ViewerBalanceLine {
  currency: CurrencyCode;
  direction: ViewerBalanceDirection;
  text: string;
}

/**
 * Maps the viewer's per-currency nets to display lines. Positive nets mean the
 * group owes the viewer; negative nets mean the viewer owes the group. Cents are
 * converted at this boundary and the absolute value is formatted, because the
 * sentence already carries the direction. Currencies are never summed together.
 */
export function getViewerBalanceLines(
  balances: readonly ViewerGroupBalance[],
  copy: ViewerBalanceCopy,
  formatAmount: (amount: number, currency: CurrencyCode) => string,
): ViewerBalanceLine[] {
  return balances
    .filter((balance) => balance.netCents !== 0)
    .map((balance) => {
      const amount = formatAmount(
        centsToAmount(Math.abs(balance.netCents)),
        balance.currency,
      );
      const owedToViewer = balance.netCents > 0;

      return {
        currency: balance.currency,
        direction: owedToViewer ? "owed-to-viewer" : "viewer-owes",
        text: owedToViewer ? copy.owedToYou(amount) : copy.youOwe(amount),
      };
    });
}
