import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { SyncStatusButton } from "@/features/sync/components/sync-status-button";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { socialStyles as styles } from "../styles/social.styles";

/**
 * Tab header: title and subtitle on the left and the sync status on the right.
 * It has no back action and no safe-area inset of its own.
 */
export function SocialHeader() {
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

      <View style={styles.headerActions}>
        <SyncStatusButton />
      </View>
    </View>
  );
}
