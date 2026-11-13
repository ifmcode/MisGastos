import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import type { DetailMissingStateLabels } from "@/shared/types/detail.types";

import { detailStyles as styles } from "./detail.styles";

export interface DetailMissingStateProps {
  labels: DetailMissingStateLabels;
  onClose: () => void;
}

/** Shown when the selected record disappeared from the live collection. */
export function DetailMissingState({
  labels,
  onClose,
}: DetailMissingStateProps) {
  const theme = useFormTheme();

  return (
    <View style={styles.missingContainer}>
      <View style={styles.missingIcon}>
        <Ionicons name="document-outline" size={30} color={theme.primary} />
      </View>
      <ThemedText type="defaultSemiBold" style={styles.missingTitle}>
        {labels.title}
      </ThemedText>
      <ThemedText style={[styles.missingMessage, { color: theme.muted }]}>
        {labels.message}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={labels.closeAccessibilityLabel}
        onPress={onClose}
        style={styles.missingButton}
      >
        <ThemedText style={styles.missingButtonText}>
          {labels.close}
        </ThemedText>
      </Pressable>
    </View>
  );
}
