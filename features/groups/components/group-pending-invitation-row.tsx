import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { getFriendDisplayName } from "@/features/friends/utils/friend-display";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupsStyles as styles } from "../styles/groups.styles";
import type { GroupInvitationItem } from "../types/group.types";

export interface GroupPendingInvitationRowProps {
  item: GroupInvitationItem;
  /** True while any moderation action is in flight. */
  busy: boolean;
  /** True while this invitation is the one being cancelled. */
  canceling: boolean;
  onCancel: (item: GroupInvitationItem) => void;
}

/** Pending invitation row of the details sheet, owner-only. */
export function GroupPendingInvitationRow({
  item,
  busy,
  canceling,
  onCancel,
}: GroupPendingInvitationRowProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groups");
  const name = item.invitee
    ? getFriendDisplayName(item.invitee)
    : t("details.unknownInvitee");

  return (
    <View style={[styles.memberRow, { borderColor: theme.border }]}>
      <View style={styles.memberBody}>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>
          {name}
        </ThemedText>
        <View style={styles.memberMetaRow}>
          <View
            style={[styles.roleBadge, { backgroundColor: theme.warningSurface }]}
          >
            <ThemedText
              style={[styles.roleBadgeText, { color: theme.warningText }]}
            >
              {t("details.pendingBadge")}
            </ThemedText>
          </View>
          {item.invitee?.email ? (
            <ThemedText
              style={[styles.rowMeta, { color: theme.muted }]}
              numberOfLines={1}
            >
              {item.invitee.email}
            </ThemedText>
          ) : null}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("details.cancelInvitationAccessibility", {
          name,
        })}
        accessibilityHint={
          canceling
            ? t("details.cancelingHint")
            : t("details.cancelInvitationHint")
        }
        accessibilityState={{ busy: canceling, disabled: busy }}
        disabled={busy}
        onPress={() => onCancel(item)}
        style={({ pressed }) => [
          styles.rowAction,
          busy && !canceling && styles.actionDisabled,
          pressed && styles.pressed,
        ]}
      >
        {canceling ? (
          <ActivityIndicator size="small" color={theme.danger} />
        ) : (
          <Ionicons
            name="close-circle-outline"
            size={22}
            color={theme.danger}
            accessible={false}
          />
        )}
      </Pressable>
    </View>
  );
}
