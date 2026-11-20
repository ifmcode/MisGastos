import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { formatCurrencyLabel } from "@/shared/utils/currency-label";
import { joinMetaParts } from "@/shared/utils/join-meta";

import { groupsStyles as styles } from "../styles/groups.styles";
import type { GroupDetail } from "../types/group.types";
import { GroupDetailActions } from "./group-detail-actions";

export interface GroupDetailHeaderProps {
  detail: GroupDetail;
  isOwner: boolean;
  onBack: () => void;
  onOpenDetails: () => void;
  onEdit: () => void;
  onInvite: () => void;
}

/**
 * Group identity and actions. The name opens the details sheet; the owner also
 * gets the edit and invite shortcuts on the right.
 */
export function GroupDetailHeader({
  detail,
  isOwner,
  onBack,
  onOpenDetails,
  onEdit,
  onInvite,
}: GroupDetailHeaderProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["groups", "common"]);
  const { group, members } = detail;
  const meta = joinMetaParts([
    t("detail.memberCount", { count: members.length }),
    formatCurrencyLabel(group.defaultCurrency),
  ]);

  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common:accessibility.back")}
          accessibilityHint={t("backHint")}
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={theme.text}
            accessible={false}
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("detail.detailsAccessibility", {
            name: group.name,
          })}
          accessibilityHint={t("detail.detailsHint")}
          onPress={onOpenDetails}
          style={({ pressed }) => [
            styles.headerIdentity,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.headerTitleRow}>
            <ThemedText
              type="title"
              style={styles.headerTitle}
              numberOfLines={2}
            >
              {group.name}
            </ThemedText>
            <Ionicons
              name="chevron-down"
              size={18}
              color={theme.muted}
              accessible={false}
            />
          </View>
        </Pressable>

        {isOwner ? (
          <GroupDetailActions
            groupName={group.name}
            onEdit={onEdit}
            onInvite={onInvite}
          />
        ) : null}
      </View>

      <View style={styles.headerMeta}>
        <ThemedText style={[styles.headerMetaLine, { color: theme.muted }]}>
          {meta}
        </ThemedText>
        <ThemedText style={[styles.headerBalance, { color: theme.success }]}>
          {t("detail.settled")}
        </ThemedText>
        {group.description ? (
          <ThemedText style={[styles.headerMetaLine, { color: theme.muted }]}>
            {group.description}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}
