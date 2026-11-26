import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { syncStyles as styles } from "../styles/sync.styles";

export interface SyncCenterHeaderProps {
  title: string;
  subtitle: string;
  onBack: () => void;
}

/** Back header of the sync center route. */
export function SyncCenterHeader({
  title,
  subtitle,
  onBack,
}: SyncCenterHeaderProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation(["sync", "common"]);

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common:accessibility.back")}
        onPress={onBack}
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name="chevron-back" size={24} color={theme.text} />
      </Pressable>
      <View style={styles.headerText}>
        <ThemedText type="title" style={styles.title} numberOfLines={2}>
          {title}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.muted }]}>
          {subtitle}
        </ThemedText>
      </View>
    </View>
  );
}
