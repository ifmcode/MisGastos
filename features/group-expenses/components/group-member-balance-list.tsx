import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { centsToAmount } from "@/features/friends/utils/friend-balance";
import type { GroupMember } from "@/features/groups/types/group.types";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";
import { formatCurrencyLabel } from "@/shared/utils/currency-label";

import { groupBalancesStyles as styles } from "../styles/group-balances.styles";
import type { GroupCurrencyBalances } from "../types/group-balance.types";
import { getGroupMemberName } from "../utils/group-expense-members";

export interface GroupMemberBalanceListProps {
  /** Raw per-member nets, one block per currency. */
  currencies: readonly GroupCurrencyBalances[];
  members: readonly GroupMember[];
  viewerUid: string;
}

/**
 * Raw nets of every member, grouped by currency and never summed across them.
 * Positive means the group owes the member; negative means the member owes.
 */
export function GroupMemberBalanceList({
  currencies,
  members,
  viewerUid,
}: GroupMemberBalanceListProps) {
  const theme = useFormTheme();
  const locale = useAppLocale();
  const { t } = useScopedTranslation(["groups", "groupExpenses"]);

  const singleCurrency = currencies.length === 1;

  return (
    <View style={styles.currencyList}>
      {currencies.map((entry) => (
        <View
          key={entry.currency}
          style={[
            styles.currencyBlock,
            { borderColor: theme.border, backgroundColor: theme.surface },
          ]}
        >
          {singleCurrency ? null : (
            <ThemedText style={[styles.currencyLabel, { color: theme.muted }]}>
              {formatCurrencyLabel(entry.currency)}
            </ThemedText>
          )}

          {entry.balances.map((balance) => {
            const name = getGroupMemberName(members, balance.userId, {
              viewerUid,
              viewerLabel: t("groupExpenses:viewerName"),
              fallback: t("groupExpenses:memberFallback"),
            });
            const amount = locale.formatCurrency(
              centsToAmount(Math.abs(balance.netCents)),
              entry.currency,
            );
            const label =
              balance.netCents > 0
                ? t("memberIsOwed", { amount })
                : t("memberOwes", { amount });

            return (
              <View key={balance.userId} style={styles.memberRow}>
                <ThemedText style={styles.memberName} numberOfLines={1}>
                  {name}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.memberAmount,
                    {
                      color:
                        balance.netCents > 0 ? theme.success : theme.danger,
                    },
                  ]}
                >
                  {label}
                </ThemedText>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
