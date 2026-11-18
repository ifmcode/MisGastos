import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { settlementsStyles as styles } from "../styles/settlements.styles";

export interface SettlementRouteHeaderProps {
  /** Already translated title. */
  title: string;
  subtitle?: string;
  onBack: () => void;
}

/** Back header of the settlement routes, used while the form is not ready. */
export function SettlementRouteHeader({
  title,
  subtitle,
  onBack,
}: SettlementRouteHeaderProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation(["settlements", "common"]);

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common:accessibility.back")}
        accessibilityHint={t("form.backHint")}
        onPress={onBack}
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name="chevron-back" size={24} color={theme.text} />
      </Pressable>

      <View style={styles.flex}>
        <ThemedText type="title" style={styles.headerTitle} numberOfLines={2}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText
            style={[styles.subtitle, { color: theme.muted }]}
            numberOfLines={2}
          >
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}
