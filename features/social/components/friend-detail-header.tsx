import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { FriendDetailHeader as FriendDetailHeaderData } from "@/features/friends/utils/friend-detail";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { friendDetailStyles as styles } from "../styles/friend-detail.styles";
import { FriendDetailBalances } from "./friend-detail-balances";

export interface FriendDetailHeaderProps {
  header: FriendDetailHeaderData;
  /** True while any friend action is in flight. */
  busy: boolean;
  /** True while this friend is the one being removed. */
  removing: boolean;
  onBack: () => void;
  onRemove: () => void;
  /** Opens the settlement form for the pair debt. */
  onSettle: () => void;
}

/**
 * Identity, friendship date, per-currency balances, back navigation and the
 * remove action. Currencies are never converted, so each debt keeps its line.
 */
export function FriendDetailHeader({
  header,
  busy,
  removing,
  onBack,
  onRemove,
  onSettle,
}: FriendDetailHeaderProps) {
  const theme = useFormTheme();
  const locale = useAppLocale();
  const { t } = useTranslation(["friends", "social", "common"]);

  // `since` is a stored timestamp; the locale formatter reads a calendar date.
  const since = header.since ? header.since.slice(0, 10) : "";
  const removeHint = removing
    ? t("friends:friends.removingHint")
    : t("friends:friends.removeHint");

  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common:accessibility.back")}
          accessibilityHint={t("social:routeBackHint")}
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={theme.text}
            accessible={false}
          />
        </Pressable>

        <View style={styles.identity}>
          <ThemedText
            type="title"
            style={styles.title}
            numberOfLines={2}
            accessibilityRole="header"
          >
            {header.name}
          </ThemedText>
          {header.email ? (
            <ThemedText
              style={[styles.meta, { color: theme.muted }]}
              numberOfLines={1}
            >
              {header.email}
            </ThemedText>
          ) : null}
          {since ? (
            <ThemedText style={[styles.meta, { color: theme.muted }]}>
              {t("friends:detail.since", { date: locale.formatDate(since) })}
            </ThemedText>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("friends:friends.removeAccessibility", {
            name: header.name,
          })}
          accessibilityHint={removeHint}
          accessibilityState={{ busy: removing, disabled: busy }}
          disabled={busy}
          onPress={onRemove}
          style={({ pressed }) => [
            styles.removeButton,
            { backgroundColor: theme.dangerSurface },
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
      </View>

      <FriendDetailBalances
        balances={header.balances}
        name={header.name}
        onSettle={onSettle}
      />
    </View>
  );
}
