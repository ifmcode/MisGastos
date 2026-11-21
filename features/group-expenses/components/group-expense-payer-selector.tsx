import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { GroupMember } from "@/features/groups/types/group.types";
import { getGroupMemberName } from "@/features/group-expenses/utils/group-expense-members";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupExpensesStyles as styles } from "../styles/group-expenses.styles";

export interface GroupExpensePayerSelectorProps {
  members: readonly GroupMember[];
  viewerUid: string;
  payerId: string;
  errorText: string | null;
  disabled: boolean;
  onChange: (payerId: string) => void;
}

/**
 * One radio chip per active member. It reuses the payer/date chip pattern of the
 * form: surface with a border, primary soft fill when selected.
 */
export function GroupExpensePayerSelector({
  members,
  viewerUid,
  payerId,
  errorText,
  disabled,
  onChange,
}: GroupExpensePayerSelectorProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groupExpenses");

  return (
    <View>
      <ThemedText style={styles.label}>{t("form.payerLabel")}</ThemedText>
      <View style={styles.chipRow}>
        {members.map((member) => {
          const name = getGroupMemberName(members, member.uid, {
            viewerUid,
            viewerLabel: t("viewerName"),
            fallback: t("memberFallback"),
          });
          const selected = payerId === member.uid;

          return (
            <Pressable
              key={member.uid}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled }}
              accessibilityLabel={t("form.payerAccessibility", { name })}
              disabled={disabled}
              onPress={() => onChange(member.uid)}
              style={({ pressed }) => [
                styles.optionChip,
                {
                  backgroundColor: selected
                    ? theme.primarySoft
                    : theme.surface,
                  borderColor: selected ? theme.primary : theme.border,
                },
                disabled && styles.optionChipDisabled,
                pressed && styles.pressed,
              ]}
            >
              <ThemedText
                style={[
                  styles.chipText,
                  { color: selected ? theme.primary : theme.text },
                ]}
                numberOfLines={1}
              >
                {name}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {errorText ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {errorText}
        </ThemedText>
      ) : null}
    </View>
  );
}
