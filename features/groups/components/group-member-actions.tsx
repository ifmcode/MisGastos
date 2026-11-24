import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, View } from "react-native";

import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupsStyles as styles } from "../styles/groups.styles";

export interface GroupMemberRowActionsProps {
  name: string;
  /** True while any moderation action of the sheet is in flight. */
  busy: boolean;
  removing: boolean;
  transferring: boolean;
  canRemove: boolean;
  canTransfer: boolean;
  onRemove: () => void;
  onTransfer: () => void;
}

/** Owner-only transfer and remove buttons of one member row. */
export function GroupMemberRowActions({
  name,
  busy,
  removing,
  transferring,
  canRemove,
  canTransfer,
  onRemove,
  onTransfer,
}: GroupMemberRowActionsProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groups");

  if (!canRemove && !canTransfer) return null;

  return (
    <View style={styles.memberActions}>
      {canTransfer ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("details.transferAccessibility", { name })}
          accessibilityHint={
            transferring
              ? t("details.transferringHint")
              : t("details.transferHint")
          }
          accessibilityState={{ busy: transferring, disabled: busy }}
          disabled={busy}
          onPress={onTransfer}
          style={({ pressed }) => [
            styles.rowAction,
            busy && !transferring && styles.actionDisabled,
            pressed && styles.pressed,
          ]}
        >
          {transferring ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Ionicons
              name="key-outline"
              size={20}
              color={theme.primary}
              accessible={false}
            />
          )}
        </Pressable>
      ) : null}

      {canRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("details.removeAccessibility", { name })}
          accessibilityHint={
            removing ? t("details.removingHint") : t("details.removeHint")
          }
          accessibilityState={{ busy: removing, disabled: busy }}
          disabled={busy}
          onPress={onRemove}
          style={({ pressed }) => [
            styles.rowAction,
            busy && !removing && styles.actionDisabled,
            pressed && styles.pressed,
          ]}
        >
          {removing ? (
            <ActivityIndicator size="small" color={theme.danger} />
          ) : (
            <Ionicons
              name="person-remove-outline"
              size={20}
              color={theme.danger}
              accessible={false}
            />
          )}
        </Pressable>
      ) : null}
    </View>
  );
}
