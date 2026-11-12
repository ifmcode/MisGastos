import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { categoryFormStyles as styles } from "../styles/category-form.styles";

export interface CategoryFormHeaderProps {
  isEditing: boolean;
  disabled: boolean;
  onClose: () => void;
}

export function CategoryFormHeader({
  isEditing,
  disabled,
  onClose,
}: CategoryFormHeaderProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["categories", "common"]);

  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <ThemedText type="title" style={styles.title}>
          {isEditing ? t("form.editTitle") : t("form.createTitle")}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.muted }]}>
          {isEditing ? t("form.editSubtitle") : t("form.createSubtitle")}
        </ThemedText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common:accessibility.closeForm")}
        hitSlop={10}
        onPress={onClose}
        disabled={disabled}
        style={styles.closeButton}
      >
        <Ionicons name="close" size={24} color={theme.muted} />
      </Pressable>
    </View>
  );
}
