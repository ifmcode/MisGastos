import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { errorBannerStyles as styles } from "./error-banner.styles";

export interface ErrorBannerProps {
  /** Already translated; nothing renders when it is empty. */
  message?: string | null;
}

/** Inline error feedback used at the top of form contents. */
export function ErrorBanner({ message }: ErrorBannerProps) {
  const theme = useFormTheme();

  if (!message) return null;

  return (
    <View
      style={[styles.banner, { backgroundColor: theme.dangerSurface }]}
    >
      <Ionicons name="alert-circle" size={20} color={theme.danger} />
      <ThemedText style={[styles.text, { color: theme.dangerText }]}>
        {message}
      </ThemedText>
    </View>
  );
}
