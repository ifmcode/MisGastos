import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { centsToAmount } from "@/features/friends/utils/friend-balance";
import type { GroupMember } from "@/features/groups/types/group.types";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupBalancesStyles as styles } from "../styles/group-balances.styles";
import { groupExpensesStyles } from "../styles/group-expenses.styles";
import type { GroupDebt } from "../types/group-balance.types";
import { getGroupMemberName } from "../utils/group-expense-members";

export interface GroupDebtRowProps {
  debt: GroupDebt;
  members: readonly GroupMember[];
  viewerUid: string;
  /** Only the two members of the pair may record the settlement. */
  canSettle: boolean;
  onSettle: (debt: GroupDebt) => void;
}

/**
 * One "who owes whom" row. The settle action is the only interactive part and
 * only exists for the debtor and the creditor; every other member reads it.
 */
export function GroupDebtRow({
  debt,
  members,
  viewerUid,
  canSettle,
  onSettle,
}: GroupDebtRowProps) {
  const theme = useFormTheme();
  const locale = useAppLocale();
  const { t } = useScopedTranslation(["groups", "groupExpenses"]);
  const nameOptions = {
    viewerUid,
    viewerLabel: t("groupExpenses:viewerName"),
    fallback: t("groupExpenses:memberFallback"),
  };
  const from = getGroupMemberName(members, debt.fromUserId, nameOptions);
  const to = getGroupMemberName(members, debt.toUserId, nameOptions);
  const amount = locale.formatCurrency(
    centsToAmount(debt.amountCents),
    debt.currency,
  );

  return (
    <View style={styles.debtRowContainer}>
      <ThemedText style={[styles.debtRow, { color: theme.text }]}>
        {t("debtRow", { from, to, amount })}
      </ThemedText>

      {canSettle ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("debtSettleAccessibility", { from, to, amount })}
          accessibilityHint={t("debtSettleHint")}
          onPress={() => onSettle(debt)}
          style={({ pressed }) => [
            styles.debtAction,
            { borderColor: theme.primary },
            pressed && groupExpensesStyles.pressed,
          ]}
        >
          <ThemedText style={[styles.debtActionText, { color: theme.primary }]}>
            {t("debtSettle")}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}
