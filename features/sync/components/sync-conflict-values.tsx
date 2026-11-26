import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { syncStyles as styles } from "../styles/sync.styles";
import {
  DELETED_STATUS_VALUE,
  type SyncConflictField,
} from "../utils/sync-conflict-view";

export interface SyncConflictValuesProps {
  title: string;
  fields: readonly SyncConflictField[];
}

const FIELD_LABEL_KEYS: Record<SyncConflictField["key"], string> = {
  amount: "fieldLabels.amount",
  concept: "fieldLabels.concept",
  wallet: "fieldLabels.wallet",
  date: "fieldLabels.date",
  status: "fieldLabels.status",
};

/**
 * One snapshot of a conflict ("your change" or "the other device's change") as
 * translated label/value rows. It renders nothing with an empty snapshot; the
 * dialog owns the "remote is gone" message.
 */
export function SyncConflictValues({
  title,
  fields,
}: SyncConflictValuesProps) {
  const theme = useFormTheme();
  const { tr } = useScopedTranslation("sync");

  if (fields.length === 0) return null;

  return (
    <View
      style={[
        styles.valuesCard,
        { borderColor: theme.border, backgroundColor: theme.background },
      ]}
    >
      <ThemedText type="defaultSemiBold" style={styles.valuesTitle}>
        {title}
      </ThemedText>

      {fields.map((field) => (
        <View key={field.key} style={styles.valueRow}>
          <ThemedText style={[styles.valueLabel, { color: theme.muted }]}>
            {tr(FIELD_LABEL_KEYS[field.key])}
          </ThemedText>
          <ThemedText style={[styles.valueText, { color: theme.text }]}>
            {field.key === "status" && field.value === DELETED_STATUS_VALUE
              ? tr("deletedValue")
              : field.value}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}
