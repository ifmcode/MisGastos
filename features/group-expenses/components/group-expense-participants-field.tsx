import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { GroupMember } from "@/features/groups/types/group.types";
import { getGroupMemberName } from "@/features/group-expenses/utils/group-expense-members";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupExpensesStyles as styles } from "../styles/group-expenses.styles";
import { GroupExpenseParticipantRow } from "./group-expense-participant-row";

export interface GroupExpenseParticipantsFieldProps {
  members: readonly GroupMember[];
  viewerUid: string;
  participantIds: readonly string[];
  disabled: boolean;
  errorText: string | null;
  onToggle: (userId: string) => void;
}

/**
 * Multi-select of the participating members. Everyone starts selected and the
 * payer may stay out; each row toggles independently.
 */
export function GroupExpenseParticipantsField({
  members,
  viewerUid,
  participantIds,
  disabled,
  errorText,
  onToggle,
}: GroupExpenseParticipantsFieldProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groupExpenses");

  return (
    <View>
      <ThemedText style={styles.label}>
        {t("form.participantsLabel")}
      </ThemedText>

      <ThemedText style={[styles.helper, { color: theme.muted }]}>
        {t("form.participantsHelper")}
      </ThemedText>

      <View style={styles.participantList}>
        {members.map((member) => {
          const name = getGroupMemberName(members, member.uid, {
            viewerUid,
            viewerLabel: t("viewerName"),
            fallback: t("memberFallback"),
          });
          const selected = participantIds.includes(member.uid);
          const email = member.email?.trim() ?? "";
          const meta =
            member.uid !== viewerUid && email.length > 0 && email !== name
              ? email
              : undefined;

          return (
            <GroupExpenseParticipantRow
              key={member.uid}
              name={name}
              meta={meta}
              selected={selected}
              disabled={disabled}
              accessibilityLabel={t("form.participantAccessibility", { name })}
              accessibilityHint={
                selected
                  ? t("form.participantCheckedHint", { name })
                  : t("form.participantUncheckedHint", { name })
              }
              onToggle={() => onToggle(member.uid)}
            />
          );
        })}
      </View>

      {members.length === 0 ? (
        <ThemedText style={[styles.helper, { color: theme.muted }]}>
          {t("form.participantsEmpty")}
        </ThemedText>
      ) : null}

      {errorText ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {errorText}
        </ThemedText>
      ) : null}
    </View>
  );
}
