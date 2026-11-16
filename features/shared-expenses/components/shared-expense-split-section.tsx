import { TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { getCurrencySymbol } from "@/features/wallets/utils/money";
import type { CurrencyCode } from "@/shared/constants/currencies";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { sharedExpensesStyles as styles } from "../styles/shared-expenses.styles";
import type { ExpenseSplitMode } from "../types/shared-expense.types";
import type { SplitValueTexts } from "../utils/shared-expense-form";
import { SharedExpenseSplitModeChips } from "./shared-expense-split-mode-chips";

const MODE_HELPER_KEYS: Record<ExpenseSplitMode, string> = {
  equal: "form.splitHelperEqual",
  percentage: "form.splitHelperPercentage",
  fixed: "form.splitHelperFixed",
  shares: "form.splitHelperShares",
};

export interface SharedExpenseSplitSectionProps {
  mode: ExpenseSplitMode;
  currency: CurrencyCode;
  viewerUid: string;
  friendUid: string;
  friendName: string;
  values: SplitValueTexts;
  errorText: string | null;
  modeErrorText: string | null;
  disabled: boolean;
  onModeChange: (mode: ExpenseSplitMode) => void;
  onValueChange: (userId: string, value: string) => void;
}

/** Split-mode chips plus one value input per participant when needed. */
export function SharedExpenseSplitSection({
  mode,
  currency,
  viewerUid,
  friendUid,
  friendName,
  values,
  errorText,
  modeErrorText,
  disabled,
  onModeChange,
  onValueChange,
}: SharedExpenseSplitSectionProps) {
  const theme = useFormTheme();
  const { t, tr } = useScopedTranslation("sharedExpenses");

  const participants = [
    { userId: viewerUid, name: t("viewerName") },
    ...(friendUid ? [{ userId: friendUid, name: friendName }] : []),
  ];
  const suffix =
    mode === "percentage"
      ? t("form.percentageSuffix")
      : mode === "fixed"
        ? getCurrencySymbol(currency)
        : t("form.sharesSuffix");

  return (
    <View>
      <ThemedText style={styles.label}>{t("form.splitLabel")}</ThemedText>

      <SharedExpenseSplitModeChips
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
                styles.participantRow,
                {
                  borderColor: errorText ? theme.danger : theme.border,
                  backgroundColor: theme.surface,
                },
              ]}
            >
              <ThemedText style={styles.participantName} numberOfLines={1}>
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
                style={[styles.participantInput, { color: theme.text }]}
              />
              <ThemedText
                style={[styles.participantSuffix, { color: theme.muted }]}
              >
                {suffix}
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      {errorText ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {errorText}
        </ThemedText>
      ) : null}
    </View>
  );
}
