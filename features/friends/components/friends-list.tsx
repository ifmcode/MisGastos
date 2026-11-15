import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { CurrencyCode } from "@/shared/constants/currencies";
import { EmptyState } from "@/shared/components/molecules/empty-state";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { friendsStyles as styles } from "../styles/friends.styles";
import type { Friend } from "../types/friend.types";
import { FriendRow } from "./friend-row";

export interface FriendsListProps {
  friends: readonly Friend[];
  currency: CurrencyCode;
  /** Id of the row or profile with an operation in flight, if any. */
  pendingId: string | null;
  onRemove: (friend: Friend) => void;
}

/** Accepted friends section with its empty state. */
export function FriendsList({
  friends,
  currency,
  pendingId,
  onRemove,
}: FriendsListProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("friends");

  return (
    <View style={styles.section}>
      <ThemedText style={[styles.sectionTitle, { color: theme.muted }]}>
        {t("friends.sectionTitle")}
      </ThemedText>

      {friends.length === 0 ? (
        <EmptyState
          title={t("friends.emptyTitle")}
          message={t("friends.emptyMessage")}
          variant="card"
        />
      ) : (
        friends.map((friend) => (
          <FriendRow
            key={friend.uid}
            friend={friend}
            currency={currency}
            pendingId={pendingId}
            onRemove={onRemove}
          />
        ))
      )}
    </View>
  );
}
