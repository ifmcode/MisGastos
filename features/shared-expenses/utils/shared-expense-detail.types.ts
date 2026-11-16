import type { Friend } from "@/features/friends/types/friend.types";
import type { CurrencyCode } from "@/shared/constants/currencies";
import type { Translate } from "@/shared/i18n/translate";

/** Wallet and movement a TICKET-044 expense will point at; empty until then. */
export interface SharedExpenseDetailLinkedMovement {
  walletName: string;
  movementLabel?: string | null;
}

/** Everything the shared-expense detail fields need, already resolved. */
export interface SharedExpenseDetailContext {
  viewerUid: string;
  friends: readonly Friend[];
  formatCurrency: (value: number, currency: CurrencyCode) => string;
  formatDate: (isoDate: string) => string;
  formatDateTime: (value: string) => string;
  t: Translate;
  linkedMovement?: SharedExpenseDetailLinkedMovement | null;
}
