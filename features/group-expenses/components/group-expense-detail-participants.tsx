import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { DetailFieldsCard } from "@/shared/components/organisms/detail-fields-card";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";
import type { DetailField } from "@/shared/types/detail.types";

import { groupExpensesStyles as styles } from "../styles/group-expenses.styles";

export interface GroupExpenseDetailParticipantsProps {
  fields: readonly DetailField[];
}

/** Participant shares of the detail, below the shared fields card. */
export function GroupExpenseDetailParticipants({
  fields,
}: GroupExpenseDetailParticipantsProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groupExpenses");

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
