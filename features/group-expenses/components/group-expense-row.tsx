import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { centsToAmount } from "@/features/friends/utils/friend-balance";
import type { GroupMember } from "@/features/groups/types/group.types";
import type { GroupExpense } from "@/features/group-expenses/types/group-expense.types";
import { getGroupExpenseRowCopy } from "@/features/group-expenses/utils/group-expense-display";
import { getGroupMemberName } from "@/features/group-expenses/utils/group-expense-members";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";
import { joinMetaParts } from "@/shared/utils/join-meta";

import { groupExpensesStyles as styles } from "../styles/group-expenses.styles";

export interface GroupExpenseRowProps {
  expense: GroupExpense;
  members: readonly GroupMember[];
  viewerUid: string;
  onPress: (expense: GroupExpense) => void;
}

/** Intl appends a period to some short months ("nov."); the mockup has none. */
function stripTrailingPeriod(value: string): string {
  return value.replace(/\.+$/, "");
}

/**
 * One expense of the group list: date gutter, description, who paid with the
 * total and, only when the viewer still owes a share, that share on the right.
 */
export function GroupExpenseRow({
  expense,
  members,
  viewerUid,
  onPress,
}: GroupExpenseRowProps) {
  const theme = useFormTheme();
  const locale = useAppLocale();
  const { t, tr } = useScopedTranslation("groupExpenses");

  const payerName = getGroupMemberName(members, expense.payerId, {
    viewerUid,
    viewerLabel: t("viewerName"),
    fallback: t("memberFallback"),
  });
  const copy = getGroupExpenseRowCopy(expense, { viewerUid, payerName, t: tr });
  const total = locale.formatCurrency(
    centsToAmount(expense.amountCents),
    expense.currency,
  );
  const meta = joinMetaParts([copy.payerLabel, total]);
  const shareLabel =
    copy.effect === "charged"
      ? t("row.yourShare", {
          amount: locale.formatCurrency(
            centsToAmount(copy.shareCents),
            expense.currency,
          ),
        })
      : undefined;
  const month = stripTrailingPeriod(
    locale.formatDate(expense.date, { month: "short" }),
  );
  const day = locale.formatDate(expense.date, { day: "numeric" });
  const accessibilityLabel = joinMetaParts([
    locale.formatDate(expense.date),
    expense.description,
    meta,
    shareLabel,
  ]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={t("row.openHint")}
      onPress={() => onPress(expense)}
      style={({ pressed }) => [
        styles.row,
        { borderColor: theme.border, backgroundColor: theme.surface },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={styles.dateGutter}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <ThemedText style={[styles.dateMonth, { color: theme.muted }]}>
          {month}
        </ThemedText>
        <ThemedText style={[styles.dateDay, { color: theme.text }]}>
          {day}
        </ThemedText>
      </View>

      <View style={[styles.iconTile, { backgroundColor: theme.primarySoft }]}>
        <Ionicons
          name="receipt-outline"
          size={18}
          color={theme.primary}
          accessible={false}
        />
      </View>

      <View style={styles.rowBody}>
        <ThemedText
          type="defaultSemiBold"
          style={styles.rowTitle}
          numberOfLines={1}
        >
          {expense.description}
        </ThemedText>
        <ThemedText
          style={[styles.rowMeta, { color: theme.muted }]}
          numberOfLines={1}
        >
          {meta}
        </ThemedText>
      </View>

      <View style={styles.rowAmountColumn}>
        {shareLabel ? (
          <ThemedText style={[styles.rowAmount, { color: theme.danger }]}>
            {shareLabel}
          </ThemedText>
        ) : null}
        <Ionicons
          name="chevron-forward"
          size={16}
          color={theme.muted}
          accessible={false}
        />
      </View>
    </Pressable>
  );
}
