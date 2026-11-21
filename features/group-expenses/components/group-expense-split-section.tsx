import { TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { getCurrencySymbol } from "@/features/wallets/utils/money";
import type { GroupMember } from "@/features/groups/types/group.types";
import type { ExpenseSplitMode } from "@/features/group-expenses/types/group-expense.types";
import { getGroupMemberName } from "@/features/group-expenses/utils/group-expense-members";
import type { SplitValueTexts } from "@/features/shared-expenses/utils/shared-expense-form";
import type { CurrencyCode } from "@/shared/constants/currencies";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupExpensesStyles as styles } from "../styles/group-expenses.styles";
import { GroupExpenseSplitModeChips } from "./group-expense-split-mode-chips";
import { GroupExpenseSplitRemaining } from "./group-expense-split-remaining";

const MODE_HELPER_KEYS: Record<ExpenseSplitMode, string> = {
  equal: "form.splitHelperEqual",
  percentage: "form.splitHelperPercentage",
  fixed: "form.splitHelperFixed",
  shares: "form.splitHelperShares",
};

export interface GroupExpenseSplitSectionProps {
  mode: ExpenseSplitMode;
  currency: CurrencyCode;
  amountText: string;
  members: readonly GroupMember[];
  viewerUid: string;
  /** Selected participants only: they are the rows of every non-equal mode. */
  participantIds: readonly string[];
  values: SplitValueTexts;
  errorText: string | null;
  modeErrorText: string | null;
  disabled: boolean;
  onModeChange: (mode: ExpenseSplitMode) => void;
  onValueChange: (userId: string, value: string) => void;
}

/** Split-mode chips plus one value input per selected participant. */
export function GroupExpenseSplitSection({
  mode,
  currency,
  amountText,
  members,
  viewerUid,
  participantIds,
  values,
  errorText,
  modeErrorText,
  disabled,
  onModeChange,
  onValueChange,
}: GroupExpenseSplitSectionProps) {
  const theme = useFormTheme();
  const { t, tr } = useScopedTranslation("groupExpenses");

  const participants = participantIds.map((userId) => ({
    userId,
    name: getGroupMemberName(members, userId, {
      viewerUid,
      viewerLabel: t("viewerName"),
      fallback: t("memberFallback"),
    }),
  }));
  const suffix =
    mode === "percentage"
      ? t("form.percentageSuffix")
      : mode === "fixed"
        ? getCurrencySymbol(currency)
        : "";

  return (
    <View>
      <ThemedText style={styles.label}>{t("form.splitLabel")}</ThemedText>

      <GroupExpenseSplitModeChips
        mode={mode}
        disabled={disabled}
        onModeChange={onModeChange}
      />

      <ThemedText style={[styles.helper, { color: theme.muted }]}>
        {tr(MODE_HELPER_KEYS[mode])}
      </ThemedText>

      {modeErrorText ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {modeErrorText}
        </ThemedText>
      ) : null}

      {mode === "equal" ? null : (
        <View style={styles.splitRows}>
          {participants.map((participant) => (
            <View
              key={participant.userId}
              style={[
                styles.splitRow,
                {
                  borderColor: errorText ? theme.danger : theme.border,
                  backgroundColor: theme.surface,
                },
              ]}
            >
              <ThemedText
                style={styles.splitName}
                numberOfLines={1}
              >
                {participant.name}
              </ThemedText>
              <TextInput
                value={values[participant.userId] ?? ""}
                onChangeText={(value) =>
                  onValueChange(participant.userId, value)
                }
                keyboardType={mode === "shares" ? "number-pad" : "decimal-pad"}
                inputMode={mode === "shares" ? "numeric" : "decimal"}
                editable={!disabled}
                accessibilityLabel={t("form.participantValueAccessibility", {
                  name: participant.name,
                })}
                style={[styles.splitInput, { color: theme.text }]}
              />
              <ThemedText style={[styles.splitSuffix, { color: theme.muted }]}>
                {suffix}
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      {mode === "fixed" ? (
        <GroupExpenseSplitRemaining
          amountText={amountText}
          values={values}
          currency={currency}
        />
      ) : null}

      {errorText ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {errorText}
        </ThemedText>
      ) : null}
    </View>
  );
}
