import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { profileStyles as styles } from "../styles/profile.styles";

export interface ProfileFormActionsProps {
  submitting: boolean;
  onPress: () => void;
}

export function ProfileFormActions({
  submitting,
  onPress,
}: ProfileFormActionsProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("profile");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("form.saveAccessibility")}
      onPress={onPress}
      disabled={submitting}
      style={[
        styles.saveButton,
        { backgroundColor: theme.primary },
        submitting && { opacity: 0.6 },
      ]}
    >
      {submitting ? (
        <ActivityIndicator color={theme.onPrimary} />
      ) : (
        <ThemedText
          style={[styles.saveButtonText, { color: theme.onPrimary }]}
        >
          {t("form.save")}
        </ThemedText>
      )}
    </Pressable>
  );
}
