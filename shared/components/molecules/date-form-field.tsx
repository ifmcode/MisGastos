import { ThemedText } from "@/components/themed-text";

import { DateQuickSelector } from "./date-quick-selector";
import { formFieldStyles as styles } from "./form-field.styles";

export interface DateFormFieldProps {
  /** Already translated copy. */
  label: string;
  valueIso: string;
  error?: string;
  accessibilityLabel: string;
  disabled: boolean;
  showLastUsedDate?: boolean;
  onSelectDate: (isoDate: string) => void;
}

/** Labelled wrapper around the shared quick date selector used by forms. */
export function DateFormField({
  label,
  valueIso,
  error,
  accessibilityLabel,
  disabled,
  showLastUsedDate = false,
  onSelectDate,
}: DateFormFieldProps) {
  return (
    <>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <DateQuickSelector
        valueIso={valueIso}
        error={error}
        disabled={disabled}
        showLastUsedDate={showLastUsedDate}
        accessibilityLabel={accessibilityLabel}
        onSelectDate={onSelectDate}
      />
    </>
  );
}
