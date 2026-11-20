import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";
import { formatCurrencyLabel } from "@/shared/utils/currency-label";

import { groupsStyles as styles } from "../styles/groups.styles";
import type { Group } from "../types/group.types";
import { getGroupMemberCount } from "../utils/group-list";

export interface GroupRowProps {
  group: Group;
  viewerUid: string;
  onOpen: (group: Group) => void;
  /** Owner-only shortcut: opens the form without leaving the Social tab. */
  onEdit: (group: Group) => void;
}

/** Group card: name, currency, member count and the "En paz" summary. */
export function GroupRow({ group, viewerUid, onOpen, onEdit }: GroupRowProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groups");
  const isOwner = group.ownerId === viewerUid;
  const currency = formatCurrencyLabel(group.defaultCurrency);

  return (
    <View
      style={[
        styles.card,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <View style={styles.cardRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("list.openAccessibility", { name: group.name })}
          accessibilityHint={t("list.openHint")}
          onPress={() => onOpen(group)}
          style={({ pressed }) => [
            styles.cardBody,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.titleRow}>
            <ThemedText
              type="defaultSemiBold"
              style={styles.rowTitle}
              numberOfLines={1}
            >
              {group.name}
            </ThemedText>
            {isOwner ? (
              <View
                style={[styles.badge, { backgroundColor: theme.primarySoft }]}
              >
                <ThemedText
                  style={[styles.badgeText, { color: theme.primary }]}
                >
                  {t("list.ownerBadge")}
                </ThemedText>
              </View>
            ) : null}
          </View>

          <ThemedText
            style={[styles.rowMeta, { color: theme.muted }]}
            numberOfLines={1}
          >
            {t("list.memberCount", { count: getGroupMemberCount(group) })}
          </ThemedText>
          <ThemedText
            style={[styles.rowMeta, { color: theme.muted }]}
            numberOfLines={1}
          >
            {t("list.defaultCurrency", { currency })}
          </ThemedText>
          <ThemedText style={[styles.rowBalance, { color: theme.success }]}>
            {t("list.settled")}
          </ThemedText>
        </Pressable>

        {isOwner ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("list.editAccessibility", {
              name: group.name,
            })}
            accessibilityHint={t("list.editHint")}
            hitSlop={8}
            onPress={() => onEdit(group)}
            style={({ pressed }) => [
              styles.cardAction,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="pencil-outline"
              size={20}
              color={theme.muted}
              accessible={false}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
