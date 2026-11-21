import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupJoinStyles as styles } from "../styles/group-join.styles";
import type { GroupJoinView } from "../utils/group-join-view";
import { GroupJoinActionButton } from "./group-join-action-button";

export interface GroupJoinResultProps {
  view: GroupJoinView;
  sending: boolean;
  onSend: () => void;
  onOpenGroup: (groupId: string) => void;
  onResetCode: () => void;
  onBackToSocial: () => void;
}

/**
 * Result card of a resolved code. It renders nothing for the `form` state; every
 * other state owns its copy and the actions that still make sense.
 */
export function GroupJoinResult({
  view,
  sending,
  onSend,
  onOpenGroup,
  onResetCode,
  onBackToSocial,
}: GroupJoinResultProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groups");
  const lookup = view.lookup;

  if (view.kind === "form" || !lookup) return null;

  const group = lookup.groupName;
  // A member whose own request was accepted gets the explicit outcome copy.
  const accepted = lookup.requestStatus === "accepted";

  return (
    <View
      style={[
        styles.card,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      {view.kind === "found" ? (
        <>
          <ThemedText type="defaultSemiBold" style={styles.resultTitle}>
            {t("join.foundTitle")}
          </ThemedText>
          <ThemedText style={[styles.resultMessage, { color: theme.muted }]}>
            {t("join.foundMessage", { group })}
          </ThemedText>
          <View style={styles.actionRow}>
            <GroupJoinActionButton
              label={sending ? t("join.sending") : t("join.send")}
              accessibilityLabel={t("join.sendAccessibility", { group })}
              accessibilityHint={t("join.sendHint")}
              loading={sending}
              disabled={sending}
              onPress={onSend}
            />
          </View>
        </>
      ) : null}

      {view.kind === "sent" ? (
        <>
          <ThemedText type="defaultSemiBold" style={styles.resultTitle}>
            {t("join.sentTitle")}
          </ThemedText>
          <ThemedText style={[styles.resultMessage, { color: theme.muted }]}>
            {t("join.sentMessage", { group })}
          </ThemedText>
          <View style={styles.actionRow}>
            <GroupJoinActionButton
              label={t("join.backToSocial")}
              accessibilityLabel={t("join.backToSocialAccessibility")}
              onPress={onBackToSocial}
            />
          </View>
        </>
      ) : null}

      {view.kind === "member" ? (
        <>
          <ThemedText type="defaultSemiBold" style={styles.resultTitle}>
            {accepted ? t("join.acceptedTitle") : t("join.memberTitle")}
          </ThemedText>
          <ThemedText style={[styles.resultMessage, { color: theme.muted }]}>
            {accepted
              ? t("join.acceptedMessage", { group })
              : t("join.memberMessage", { group })}
          </ThemedText>
          <View style={styles.actionRow}>
            <GroupJoinActionButton
              label={t("join.openGroup")}
              accessibilityLabel={t("join.openGroupAccessibility", { group })}
              accessibilityHint={t("join.openGroupHint")}
              onPress={() => onOpenGroup(lookup.groupId)}
            />
          </View>
        </>
      ) : null}

      {view.kind === "pending" ? (
        <>
          <ThemedText type="defaultSemiBold" style={styles.resultTitle}>
            {t("join.pendingTitle")}
          </ThemedText>
          <ThemedText style={[styles.resultMessage, { color: theme.muted }]}>
            {t("join.pendingMessage", { group })}
          </ThemedText>
        </>
      ) : null}

      {view.kind === "rejected" ? (
        <>
          <ThemedText type="defaultSemiBold" style={styles.resultTitle}>
            {t("join.rejectedTitle")}
          </ThemedText>
          <ThemedText style={[styles.resultMessage, { color: theme.muted }]}>
            {t("join.rejectedMessage", { group })}
          </ThemedText>
          <View style={styles.actionRow}>
            <GroupJoinActionButton
              label={t("join.anotherCode")}
              accessibilityLabel={t("join.anotherCodeAccessibility")}
              accessibilityHint={t("join.anotherCodeHint")}
              variant="secondary"
              onPress={onResetCode}
            />
          </View>
        </>
      ) : null}
    </View>
  );
}
