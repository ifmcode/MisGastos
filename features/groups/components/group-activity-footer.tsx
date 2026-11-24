import { ActivityIndicator, Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupActivityStyles as styles } from "../styles/group-activity.styles";

export interface GroupActivityFooterProps {
  /** Busy state of the next page; the button stays visible while it loads. */
  loading: boolean;
  onPress: () => void;
}

/** **Cargar más** action of the activity register; hidden without more pages. */
export function GroupActivityFooter({
  loading,
  onPress,
}: GroupActivityFooterProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groups");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("history.loadMoreAccessibility")}
      accessibilityHint={t("history.loadMoreHint")}
      accessibilityState={{ busy: loading, disabled: loading }}
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.footer,
        { borderColor: theme.border, backgroundColor: theme.surface },
        (pressed || loading) && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.primary} />
      ) : null}
      <ThemedText style={[styles.footerText, { color: theme.primary }]}>
        {loading ? t("history.loadingMore") : t("history.loadMore")}
      </ThemedText>
    </Pressable>
  );
}
