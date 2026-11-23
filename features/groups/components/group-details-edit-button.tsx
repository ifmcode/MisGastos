import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupsStyles as styles } from "../styles/groups.styles";

export interface GroupDetailsEditButtonProps {
  /** Closes the sheet and opens the group edit form. */
  onPress: () => void;
}

/** Owner-only labeled edit action at the top of the details sheet. */
export function GroupDetailsEditButton({
  onPress,
}: GroupDetailsEditButtonProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groups");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("details.editGroupAccessibility")}
      accessibilityHint={t("detail.editHint")}
      onPress={onPress}
      style={({ pressed }) => [
        styles.editGroupButton,
        { backgroundColor: theme.primarySoft },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name="pencil-outline"
        size={18}
        color={theme.primary}
        accessible={false}
      />
      <ThemedText style={[styles.editGroupButtonText, { color: theme.primary }]}>
        {t("details.editGroup")}
      </ThemedText>
    </Pressable>
  );
}
