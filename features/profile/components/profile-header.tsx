import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { profileStyles as styles } from "../styles/profile.styles";

export interface ProfileHeaderProps {
  onBack: () => void;
}

export function ProfileHeader({ onBack }: ProfileHeaderProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["profile", "common"]);

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common:accessibility.back")}
        onPress={onBack}
        style={styles.backButton}
      >
        <Ionicons name="chevron-back" size={24} color={theme.text} />
      </Pressable>

      <View style={styles.headerText}>
        <ThemedText type="title" style={styles.title}>
          {t("title")}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.muted }]}>
          {t("subtitle")}
        </ThemedText>
      </View>
    </View>
  );
}
