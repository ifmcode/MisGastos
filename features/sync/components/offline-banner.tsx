import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { offlineBannerStyles as styles } from "../styles/offline-banner.styles";

export interface OfflineBannerProps {
  /** Distance from the bottom edge, already resolved by the host. */
  bottomOffset: number;
}

/**
 * Edge-to-edge strip that reports reads from the local cache. It is inert
 * (`pointerEvents="none"`) because phase 3 has no retry action. The container
 * is the single accessibility element so screen readers announce the full
 * sentence once; the visible short label and the icon are decorative for a11y.
 */
export function OfflineBanner({ bottomOffset }: OfflineBannerProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("sync");
  // Solid amber behind dark text on dark mode and white text on light mode: a
  // translucent `warningSurface` was unreadable over light content.
  const foreground = theme.isDark ? theme.background : theme.onPrimary;

  return (
    <View
      pointerEvents="none"
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={t("offlineBanner.accessibility")}
      style={[
        styles.banner,
        { bottom: bottomOffset, backgroundColor: theme.warning },
      ]}
    >
      <Ionicons
        name="cloud-offline-outline"
        size={16}
        color={foreground}
        accessible={false}
      />
      <ThemedText
        accessible={false}
        numberOfLines={1}
        style={[styles.label, { color: foreground }]}
      >
        {t("offlineBanner.label")}
      </ThemedText>
    </View>
  );
}
