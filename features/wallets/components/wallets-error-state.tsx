import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { walletsStyles } from "../styles/wallets.styles";

export interface WalletsErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function WalletsErrorState({ message, onRetry }: WalletsErrorStateProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["wallets", "common"]);

  return (
    <View style={walletsStyles.centered}>
      <Ionicons
        name="cloud-offline-outline"
        size={42}
        color={theme.danger}
      />
      <ThemedText type="defaultSemiBold" style={walletsStyles.errorTitle}>
        {t("errorTitle")}
      </ThemedText>
      <ThemedText style={walletsStyles.centeredText}>{message}</ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("retryAccessibility")}
        onPress={onRetry}
        style={walletsStyles.retryButton}
      >
        <ThemedText style={walletsStyles.retryButtonText}>
          {t("common:actions.retry")}
        </ThemedText>
      </Pressable>
    </View>
  );
}
