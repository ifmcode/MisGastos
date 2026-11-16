import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
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
  /** Opens the friend detail; removal lives on that screen (TICKET-042). */
  onOpen: (friend: Friend) => void;
}

/**
 * Accepted friend row: identity, one derived balance line per currency and a
 * chevron that opens the detail. Currencies are never converted.
 */
export function FriendRow({ friend, onOpen }: FriendRowProps) {
  const theme = useFormTheme();
  const locale = useAppLocale();
  const { t } = useScopedTranslation("friends");
  const name = getFriendDisplayName(friend);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("friends.openAccessibility", { name })}
      accessibilityHint={t("friends.openHint")}
      onPress={() => onOpen(friend)}
      style={({ pressed }) => [
        styles.friendCard,
        { borderColor: theme.border, backgroundColor: theme.surface },
        pressed && styles.pressed,
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

        {friend.balances.length === 0 ? (
          <ThemedText style={[styles.friendBalance, { color: theme.muted }]}>
            {t("balance.settled")}
          </ThemedText>
        ) : (
          friend.balances.map((balance) => {
            const direction = getFriendBalanceDirection(
              balance.netBalanceCents,
            );
            const owesViewer = direction === "friend-owes-viewer";
            const amount = locale.formatCurrency(
              Math.abs(centsToAmount(balance.netBalanceCents)),
              balance.currency,
            );
            const label = owesViewer
              ? t("balance.owesYou", { amount })
              : t("balance.youOwe", { amount });

            return (
              <ThemedText
                key={balance.currency}
                style={[
                  styles.friendBalance,
                  { color: owesViewer ? theme.success : theme.danger },
                ]}
              >
                {label}
              </ThemedText>
            );
          })
        )}
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color={theme.muted}
        accessible={false}
      />
    </Pressable>
  );
}
