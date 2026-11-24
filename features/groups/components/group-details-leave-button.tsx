import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupsStyles as styles } from "../styles/groups.styles";

export interface GroupDetailsLeaveButtonProps {
  groupName: string;
  /** True while any membership action is in flight. */
  busy: boolean;
  /** True while the leave operation itself is in flight. */
  leaving: boolean;
  onPress: () => void;
}

/** Non-owner danger action that opens the leave confirmation. */
export function GroupDetailsLeaveButton({
  groupName,
  busy,
  leaving,
  onPress,
}: GroupDetailsLeaveButtonProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groups");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("details.leaveAccessibility", { name: groupName })}
      accessibilityHint={
        leaving ? t("details.leavingHint") : t("details.leaveHint")
      }
      accessibilityState={{ busy: leaving, disabled: busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.leaveButton,
        { backgroundColor: theme.dangerSurface },
        busy && !leaving && styles.actionDisabled,
        pressed && styles.pressed,
      ]}
    >
      {leaving ? (
        <ActivityIndicator size="small" color={theme.danger} />
      ) : (
        <Ionicons
          name="log-out-outline"
          size={18}
          color={theme.danger}
          accessible={false}
        />
      )}
      <ThemedText style={[styles.leaveButtonText, { color: theme.danger }]}>
        {t("details.leaveGroup")}
      </ThemedText>
    </Pressable>
  );
}
