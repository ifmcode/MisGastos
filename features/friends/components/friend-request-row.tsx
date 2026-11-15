import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { friendsStyles as styles } from "../styles/friends.styles";
import type { FriendRequestItem } from "../types/friend.types";
import { getFriendDisplayName } from "../utils/friend-display";
import { FriendActionButton } from "./friend-action-button";

export interface FriendRequestRowProps {
  request: FriendRequestItem;
  /** Id of the item with an operation in flight, if any. */
  pendingId: string | null;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onCancel: (requestId: string) => void;
}

/** One incoming or outgoing request with its single-flight actions. */
export function FriendRequestRow({
  request,
  pendingId,
  onAccept,
  onReject,
  onCancel,
}: FriendRequestRowProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("friends");
  const name = getFriendDisplayName(request.profile);
  const incoming = request.direction === "incoming";
  const busy = pendingId !== null;
  const pending = pendingId === request.requestId;
  const busyHint = busy && !pending ? t("requests.busyHint") : undefined;

  return (
    <View
      style={[
        styles.requestCard,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <View style={styles.rowBody}>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>
          {name}
        </ThemedText>
        <ThemedText
          style={[styles.rowMeta, { color: theme.muted }]}
          numberOfLines={1}
        >
          {request.profile.email}
        </ThemedText>
        <ThemedText style={[styles.rowMeta, { color: theme.muted }]}>
          {incoming ? t("requests.received") : t("requests.sent")}
        </ThemedText>
      </View>

      <View style={styles.rowActions}>
        {incoming ? (
          <>
            <FriendActionButton
              label={t("requests.accept")}
              accessibilityLabel={t("requests.acceptAccessibility", { name })}
              accessibilityHint={busyHint}
              loading={pending}
              disabled={busy}
              onPress={() => onAccept(request.requestId)}
            />
            <FriendActionButton
              label={t("requests.reject")}
              accessibilityLabel={t("requests.rejectAccessibility", { name })}
              accessibilityHint={busyHint}
              variant="danger"
              disabled={busy}
              onPress={() => onReject(request.requestId)}
            />
          </>
        ) : (
          <FriendActionButton
            label={t("requests.cancel")}
            accessibilityLabel={t("requests.cancelAccessibility", { name })}
            accessibilityHint={busyHint}
            variant="secondary"
            loading={pending}
            disabled={busy}
            onPress={() => onCancel(request.requestId)}
          />
        )}
      </View>
    </View>
  );
}
