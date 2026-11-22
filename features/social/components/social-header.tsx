import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { IconBadgeButton } from "@/shared/components/molecules/icon-badge-button";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { socialStyles as styles } from "../styles/social.styles";

export interface SocialHeaderProps {
  /** Incoming plus outgoing `pending` requests. */
  pendingCount: number;
  onOpenRequests: () => void;
}

/**
 * Tab header: title and subtitle on the left, the pending requests icon button on
 * the right. It has no back action and no safe-area inset of its own.
 */
export function SocialHeader({
  pendingCount,
  onOpenRequests,
}: SocialHeaderProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("social");

  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <ThemedText type="title">{t("title")}</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.muted }]}>
          {t("subtitle")}
        </ThemedText>
      </View>

      <IconBadgeButton
        icon="mail-unread-outline"
        count={pendingCount}
        accessibilityLabel={
          pendingCount > 0
            ? t("pending.rowAccessibility", { count: pendingCount })
            : t("pending.labelZero")
        }
        accessibilityHint={t("pending.hint")}
        onPress={onOpenRequests}
      />
    </View>
  );
}
