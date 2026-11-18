import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { notificationsStyles as styles } from "../styles/notifications.styles";

export interface NotificationsHeaderProps {
  title: string;
  subtitle: string;
  onBack: () => void;
}

/** Back header of the inbox route. */
export function NotificationsHeader({
  title,
  subtitle,
  onBack,
}: NotificationsHeaderProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation(["notifications", "common"]);

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common:accessibility.back")}
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
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
