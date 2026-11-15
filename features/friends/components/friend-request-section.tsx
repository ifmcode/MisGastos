import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { friendsStyles as styles } from "../styles/friends.styles";
import type { FriendRequestItem } from "../types/friend.types";
import { FriendRequestRow } from "./friend-request-row";

export interface FriendRequestSectionProps {
  /** Already translated section title. */
  title: string;
  requests: readonly FriendRequestItem[];
  pendingId: string | null;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onCancel: (requestId: string) => void;
}

/** One direction of requests; renders nothing when the list is empty. */
export function FriendRequestSection({
  title,
  requests,
  pendingId,
  onAccept,
  onReject,
  onCancel,
}: FriendRequestSectionProps) {
  const theme = useFormTheme();

  if (requests.length === 0) return null;

  return (
    <View style={styles.section}>
      <ThemedText style={[styles.sectionTitle, { color: theme.muted }]}>
        {title}
      </ThemedText>
      {requests.map((request) => (
        <FriendRequestRow
          key={request.requestId}
          request={request}
          pendingId={pendingId}
          onAccept={onAccept}
          onReject={onReject}
          onCancel={onCancel}
        />
      ))}
    </View>
  );
}
