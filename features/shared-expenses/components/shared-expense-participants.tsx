import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { DetailFieldsCard } from "@/shared/components/organisms/detail-fields-card";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";
import type { DetailField } from "@/shared/types/detail.types";

import { sharedExpensesStyles as styles } from "../styles/shared-expenses.styles";

export interface SharedExpenseParticipantsProps {
  fields: readonly DetailField[];
}

/** Participant shares of the detail, below the shared fields card. */
export function SharedExpenseParticipants({
  fields,
}: SharedExpenseParticipantsProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("sharedExpenses");

  if (fields.length === 0) return null;

  return (
    <View style={styles.detailSection}>
      <ThemedText
        accessibilityRole="header"
        style={[styles.detailSectionTitle, { color: theme.muted }]}
      >
        {t("detail.participants")}
      </ThemedText>
      <DetailFieldsCard fields={fields} />
    </View>
  );
}
