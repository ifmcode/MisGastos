import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import type { DetailSummary } from "@/shared/types/detail.types";

import { detailStyles as styles } from "./detail.styles";

export interface DetailSummaryCardProps {
  summary: DetailSummary;
}

export function DetailSummaryCard({ summary }: DetailSummaryCardProps) {
  const theme = useFormTheme();
  const amountColor =
    summary.tone === "positive"
      ? theme.success
      : summary.tone === "negative"
        ? theme.danger
        : theme.text;

  return (
    <View
      style={[
        styles.summaryCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <ThemedText style={[styles.summaryType, { color: theme.muted }]}>
        {summary.label}
      </ThemedText>
      <ThemedText style={[styles.summaryAmount, { color: amountColor }]}>
        {summary.amount}
      </ThemedText>
      <ThemedText style={[styles.summaryCurrency, { color: theme.muted }]}>
        {summary.meta}
      </ThemedText>
    </View>
  );
}
