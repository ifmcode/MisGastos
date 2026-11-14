import { ActivityIndicator, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { loadingStateStyles as styles } from "./loading-state.styles";

export type LoadingStateVariant = "screen" | "inline";

export interface LoadingStateProps {
  /** Already translated: the shared component never owns copy. */
  message: string;
  variant?: LoadingStateVariant;
  size?: "small" | "large";
}

/** Full-screen or section loading feedback with a caller-provided message. */
export function LoadingState({
  message,
  variant = "screen",
  size = "large",
}: LoadingStateProps) {
  const theme = useFormTheme();
  const inline = variant === "inline";

  return (
    <View style={inline ? styles.inline : styles.screen}>
      <ActivityIndicator size={size} color={theme.primary} />
      <ThemedText style={inline ? styles.inlineText : styles.screenText}>
        {message}
      </ThemedText>
    </View>
  );
}
