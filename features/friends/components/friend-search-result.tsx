import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { friendsStyles as styles } from "../styles/friends.styles";
import type { FriendSearchResult as FriendSearchResultValue } from "../types/friend.types";
import {
  getFriendDisplayName,
  getFriendRelationNoteKey,
} from "../utils/friend-display";
import { FriendActionButton } from "./friend-action-button";

export interface FriendSearchResultProps {
  result: FriendSearchResultValue;
  /** Id of the item with an operation in flight, if any. */
  pendingId: string | null;
  onSend: (recipientUid: string) => void;
}

/** Card with the matched profile and the relation-appropriate action. */
export function FriendSearchResult({
  result,
  pendingId,
  onSend,
}: FriendSearchResultProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("friends");
  const name = getFriendDisplayName(result.profile);
  const sending = pendingId === result.profile.uid;

  return (
    <View
      style={[
        styles.resultCard,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <ThemedText type="defaultSemiBold" numberOfLines={1}>
        {name}
      </ThemedText>
      <ThemedText
        style={[styles.resultMeta, { color: theme.muted }]}
        numberOfLines={1}
      >
        {result.profile.email}
      </ThemedText>

      {result.relation === "none" ? (
        <View style={styles.resultActions}>
          <FriendActionButton
            label={sending ? t("search.sending") : t("search.send")}
            accessibilityLabel={t("search.sendAccessibility", { name })}
            accessibilityHint={
              pendingId && !sending ? t("requests.busyHint") : undefined
            }
            loading={sending}
            disabled={pendingId !== null}
            onPress={() => onSend(result.profile.uid)}
          />
        </View>
      ) : (
        <ThemedText style={[styles.resultNote, { color: theme.muted }]}>
          {t(getFriendRelationNoteKey(result.relation))}
        </ThemedText>
      )}
    </View>
  );
}
