import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transferHistoryStyles as styles } from "../styles/transfer-history.styles";

export interface TransferHistoryHeaderProps {
  onBack: () => void;
}

export function TransferHistoryHeader({ onBack }: TransferHistoryHeaderProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["transfers", "common"]);

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
        <ThemedText type="title" style={styles.title} numberOfLines={2}>
          {t("historyTitle")}
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          {t("historySubtitle")}
        </ThemedText>
      </View>
    </View>
  );
}
