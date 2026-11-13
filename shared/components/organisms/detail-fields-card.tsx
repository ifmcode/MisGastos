import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import type { DetailField } from "@/shared/types/detail.types";

import { detailStyles as styles } from "./detail.styles";

export interface DetailFieldsCardProps {
  fields: readonly DetailField[];
}

export function DetailFieldsCard({ fields }: DetailFieldsCardProps) {
  const theme = useFormTheme();

  return (
    <View
      style={[
        styles.detailsCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      {fields.map((field, index) => (
        <View
          key={field.key}
          style={[
            styles.fieldRow,
            { borderBottomColor: theme.border },
            index === fields.length - 1 && styles.fieldRowLast,
          ]}
        >
          <ThemedText style={[styles.fieldLabel, { color: theme.muted }]}>
            {field.label}
          </ThemedText>
          <ThemedText style={styles.fieldValue}>{field.value}</ThemedText>
        </View>
      ))}
    </View>
  );
}
