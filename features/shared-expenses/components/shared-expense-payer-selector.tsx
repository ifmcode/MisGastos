import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { sharedExpensesStyles as styles } from "../styles/shared-expenses.styles";

export interface SharedExpensePayerSelectorProps {
  viewerUid: string;
  friendUid: string;
  friendName: string;
  payerId: string;
  errorText: string | null;
  disabled: boolean;
  onChange: (payerId: string) => void;
}

/** Two-option payer selector: the viewer or the selected friend. */
export function SharedExpensePayerSelector({
  viewerUid,
  friendUid,
  friendName,
  payerId,
  errorText,
  disabled,
  onChange,
}: SharedExpensePayerSelectorProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("sharedExpenses");

  const options = [
    {
      id: viewerUid,
      label: t("form.payerYou"),
      accessibilityLabel: t("form.payerAccessibilityYou"),
    },
  ];

  if (friendUid) {
    options.push({
      id: friendUid,
      label: t("form.payerFriend", { name: friendName }),
      accessibilityLabel: t("form.payerAccessibilityFriend", {
        name: friendName,
      }),
    });
  }

  return (
    <View>
      <ThemedText style={styles.label}>{t("form.payerLabel")}</ThemedText>
      <View style={styles.chipRow}>
        {options.map((option) => {
          const selected = payerId === option.id;

          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled }}
              accessibilityLabel={option.accessibilityLabel}
              disabled={disabled}
              onPress={() => onChange(option.id)}
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
              >
                {option.label}
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
