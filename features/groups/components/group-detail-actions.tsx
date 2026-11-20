import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupsStyles as styles } from "../styles/groups.styles";

export interface GroupDetailActionsProps {
  groupName: string;
  onEdit: () => void;
  onInvite: () => void;
}

/** Owner-only header shortcuts: edit the metadata and invite more friends. */
export function GroupDetailActions({
  groupName,
  onEdit,
  onInvite,
}: GroupDetailActionsProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groups");

  return (
    <View style={styles.headerActions}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("detail.editAccessibility", { name: groupName })}
        accessibilityHint={t("detail.editHint")}
        onPress={onEdit}
        style={({ pressed }) => [
          styles.headerAction,
          { backgroundColor: theme.primarySoft },
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          name="pencil-outline"
          size={20}
          color={theme.primary}
          accessible={false}
        />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("detail.inviteAccessibility", {
          name: groupName,
        })}
        accessibilityHint={t("detail.inviteHint")}
        onPress={onInvite}
        style={({ pressed }) => [
          styles.headerAction,
          { backgroundColor: theme.primarySoft },
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          name="person-add-outline"
          size={20}
          color={theme.primary}
          accessible={false}
        />
      </Pressable>
    </View>
  );
}
