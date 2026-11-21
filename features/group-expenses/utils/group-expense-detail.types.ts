import type { GroupMember } from "@/features/groups/types/group.types";
import type { CurrencyCode } from "@/shared/constants/currencies";
import type { Translate } from "@/shared/i18n/translate";

/** Everything the group-expense detail needs, already resolved by the screen. */
export interface GroupExpenseDetailContext {
  viewerUid: string;
  members: readonly GroupMember[];
  formatCurrency: (value: number, currency: CurrencyCode) => string;
  formatDate: (isoDate: string) => string;
  t: Translate;
}
