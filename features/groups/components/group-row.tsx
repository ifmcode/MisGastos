import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { GroupBalanceLines } from "@/features/group-expenses/components/group-balance-lines";
import type { ViewerGroupBalance } from "@/features/group-expenses/types/group-balance.types";
import {
  getViewerBalanceLines,
  type ViewerBalanceCopy,
} from "@/features/group-expenses/utils/viewer-balance-lines";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";
import { formatCurrencyLabel } from "@/shared/utils/currency-label";
import { joinMetaParts } from "@/shared/utils/join-meta";

import { groupsStyles as styles } from "../styles/groups.styles";
import type { Group } from "../types/group.types";
import { getGroupMemberCount } from "../utils/group-list";

export interface GroupRowProps {
  group: Group;
  viewerUid: string;
  /** The viewer's net per currency; empty renders as "En paz". */
  balances: readonly ViewerGroupBalance[];
  onOpen: (group: Group) => void;
  /** Owner-only shortcut: opens the form without leaving the Social tab. */
  onEdit: (group: Group) => void;
}

/** Group card: name, currency, member count and the viewer's balance. */
export function GroupRow({
  group,
  viewerUid,
  balances,
  onOpen,
  onEdit,
}: GroupRowProps) {
  const theme = useFormTheme();
  const locale = useAppLocale();
  const { t } = useScopedTranslation("groups");
  const isOwner = group.ownerId === viewerUid;
  const currency = formatCurrencyLabel(group.defaultCurrency);
  const copy: ViewerBalanceCopy = {
    owedToYou: (amount) => t("youAreOwed", { amount }),
    youOwe: (amount) => t("youOwe", { amount }),
  };
  const lines = getViewerBalanceLines(balances, copy, locale.formatCurrency);
  const balanceLabel =
    lines.length > 0
      ? lines.map((line) => line.text).join(". ")
      : t("list.settled");
  const accessibilityLabel = joinMetaParts([
    t("list.openAccessibility", { name: group.name }),
    balanceLabel,
  ]);

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
          accessibilityLabel={accessibilityLabel}
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

          <GroupBalanceLines lines={lines} settledLabel={t("list.settled")} />
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
