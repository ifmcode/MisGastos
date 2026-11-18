import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import {
  AccessibilityInfo,
  Pressable,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { notificationsStyles as styles } from "../styles/notifications.styles";
import type { NotificationBannerModel } from "../utils/notification-banner";

export interface NotificationBannerProps {
  banner: NotificationBannerModel;
  onOpen: () => void;
  onDismiss: () => void;
}

/**
 * Floating card at the top of the screen. The 4-second timer lives in the hook,
 * so this component only presents, announces once per notification and reports
 * the two actions. Its wrapper is `box-none`: empty space stays tappable.
 */
export function NotificationBanner({
  banner,
  onOpen,
  onDismiss,
}: NotificationBannerProps) {
  const theme = useFormTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(banner.title);
  }, [banner.id, banner.title]);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.bannerOverlay, { paddingTop: insets.top + 8 }]}
    >
      <View
        style={[
          styles.bannerCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={banner.openAccessibilityLabel}
          accessibilityHint={banner.openHint}
          accessibilityLiveRegion="polite"
          onPress={onOpen}
          style={({ pressed }) => [
            styles.bannerBody,
            pressed && styles.pressed,
          ]}
        >
          <View
            style={[styles.bannerIcon, { backgroundColor: theme.primarySoft }]}
          >
            <Ionicons
              name={banner.icon}
              size={20}
              color={theme.primary}
              accessible={false}
            />
          </View>
          <View style={styles.bannerText}>
            <ThemedText style={styles.bannerTitle} numberOfLines={2}>
              {banner.title}
            </ThemedText>
            <ThemedText style={[styles.bannerMeta, { color: theme.muted }]}>
              {banner.meta}
            </ThemedText>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={banner.closeAccessibilityLabel}
          onPress={onDismiss}
          style={({ pressed }) => [
            styles.bannerClose,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="close"
            size={20}
            color={theme.muted}
            accessible={false}
          />
        </Pressable>
      </View>
    </View>
  );
}
