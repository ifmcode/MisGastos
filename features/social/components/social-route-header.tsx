import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { socialStyles as styles } from "../styles/social.styles";

export interface SocialRouteHeaderProps {
  /** Already translated title. */
  title: string;
  /** Already translated subtitle; omitted when the route has no summary. */
  subtitle?: string;
  onBack: () => void;
}

/** Header with a back action, shared by the add-friend and requests routes. */
export function SocialRouteHeader({
  title,
  subtitle,
  onBack,
}: SocialRouteHeaderProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["social", "common"]);

  return (
    <View style={styles.routeHeader}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common:accessibility.back")}
        accessibilityHint={t("routeBackHint")}
        onPress={onBack}
        style={styles.backButton}
      >
        <Ionicons name="chevron-back" size={24} color={theme.text} />
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
