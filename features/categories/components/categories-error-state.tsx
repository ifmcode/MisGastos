import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { categoriesStyles } from "../styles/categories.styles";

export interface CategoriesErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function CategoriesErrorState({
  message,
  onRetry,
}: CategoriesErrorStateProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["categories", "common"]);

  return (
    <View style={categoriesStyles.centered}>
      <Ionicons
        name="cloud-offline-outline"
        size={42}
        color={theme.danger}
      />
      <ThemedText type="defaultSemiBold" style={categoriesStyles.errorTitle}>
        {t("errorTitle")}
      </ThemedText>
      <ThemedText style={categoriesStyles.centeredText}>{message}</ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("retryAccessibility")}
        onPress={onRetry}
        style={categoriesStyles.retryButton}
      >
        <ThemedText style={categoriesStyles.retryButtonText}>
          {t("common:actions.retry")}
        </ThemedText>
      </Pressable>
    </View>
  );
}
