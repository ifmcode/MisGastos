import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { CurrencyCode } from "@/shared/constants/currencies";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { friendsStyles as styles } from "../styles/friends.styles";
import type { Friend } from "../types/friend.types";
import {
  centsToAmount,
  getFriendBalanceDirection,
} from "../utils/friend-balance";
import { getFriendDisplayName } from "../utils/friend-display";

export interface FriendRowProps {
  friend: Friend;
  currency: CurrencyCode;
  /** Id of the row or profile with an operation in flight, if any. */
  pendingId: string | null;
  onRemove: (friend: Friend) => void;
}

/** Accepted friend with the derived net balance and the remove action. */
export function FriendRow({
  friend,
  currency,
  pendingId,
  onRemove,
}: FriendRowProps) {
  const theme = useFormTheme();
  const locale = useAppLocale();
  const { t } = useScopedTranslation("friends");
  const name = getFriendDisplayName(friend);
  const direction = getFriendBalanceDirection(friend.netBalanceCents);
  const amount = locale.formatCurrency(
    Math.abs(centsToAmount(friend.netBalanceCents)),
    currency,
  );

  const busy = pendingId !== null;
  const removing = pendingId === friend.uid;
  const hint = removing
    ? t("friends.removingHint")
    : busy
      ? t("requests.busyHint")
      : t("friends.removeHint");

  const balanceLabel =
    direction === "friend-owes-viewer"
      ? t("balance.owesYou", { amount })
      : direction === "viewer-owes-friend"
        ? t("balance.youOwe", { amount })
        : t("balance.settled");

  const balanceColor =
    direction === "friend-owes-viewer"
      ? theme.success
      : direction === "viewer-owes-friend"
        ? theme.danger
        : theme.muted;

  return (
    <View
      style={[
        styles.friendCard,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <View style={styles.friendBody}>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>
          {name}
        </ThemedText>
        {friend.email ? (
          <ThemedText
            style={[styles.rowMeta, { color: theme.muted }]}
            numberOfLines={1}
          >
            {friend.email}
          </ThemedText>
        ) : null}
        <ThemedText style={[styles.friendBalance, { color: balanceColor }]}>
          {balanceLabel}
        </ThemedText>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("friends.removeAccessibility", { name })}
        accessibilityHint={hint}
        accessibilityState={{ busy: removing, disabled: busy && !removing }}
        disabled={busy}
        onPress={() => onRemove(friend)}
        style={({ pressed }) => [
          styles.iconButton,
          { backgroundColor: theme.dangerSurface },
          busy && styles.actionButtonDisabled,
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
  );
}
