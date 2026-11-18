import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { settlementsStyles as styles } from "../styles/settlements.styles";
import type { SettlementAmountMode } from "../utils/settlement-form";

export interface SettlementFormModeChipsProps {
  mode: SettlementAmountMode;
  disabled: boolean;
  onChange: (mode: SettlementAmountMode) => void;
}

const MODES: readonly SettlementAmountMode[] = ["total", "partial"];

/** Total locks the whole outstanding debt; partial opens the amount input. */
export function SettlementFormModeChips({
  mode,
  disabled,
  onChange,
}: SettlementFormModeChipsProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("settlements");

  return (
    <View>
      <ThemedText style={styles.label}>{t("form.modeLabel")}</ThemedText>
      <View
        style={styles.chipRow}
        accessibilityRole="radiogroup"
        accessibilityLabel={t("form.modeLabel")}
      >
        {MODES.map((item) => {
          const selected = mode === item;
          const label =
            item === "total" ? t("form.modeTotal") : t("form.modePartial");

          return (
            <Pressable
              key={item}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled }}
              accessibilityLabel={t("form.modeAccessibility", { label })}
              disabled={disabled}
              onPress={() => onChange(item)}
              style={({ pressed }) => [
                styles.optionChip,
                {
                  backgroundColor: selected ? theme.primarySoft : theme.surface,
                  borderColor: selected ? theme.primary : theme.border,
                },
                disabled && styles.optionChipDisabled,
                pressed && styles.pressed,
              ]}
            >
              <ThemedText
                style={[
                  styles.optionChipText,
                  { color: selected ? theme.primary : theme.text },
                ]}
              >
                {label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
