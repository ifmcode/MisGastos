import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { groupsStyles as styles } from "../styles/groups.styles";

export interface GroupRouteHeaderProps {
  /** Already translated title and optional subtitle. */
  title: string;
  subtitle?: string;
  onBack: () => void;
}

/** Back header of the groups routes; it never imports the social header. */
export function GroupRouteHeader({
  title,
  subtitle,
  onBack,
}: GroupRouteHeaderProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["groups", "common"]);

  return (
    <View style={styles.routeHeader}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common:accessibility.back")}
        accessibilityHint={t("backHint")}
        onPress={onBack}
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          name="chevron-back"
          size={24}
          color={theme.text}
          accessible={false}
        />
      </Pressable>

      <View style={styles.routeHeaderText}>
        <ThemedText type="title" style={styles.routeTitle} numberOfLines={2}>
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
