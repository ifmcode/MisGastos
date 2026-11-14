import { ThemedText } from "@/components/themed-text";
import { formatDateInput } from "@/shared/utils/date";

import { DateQuickSelector } from "./date-quick-selector";
import { formFieldStyles as styles } from "./form-field.styles";

export interface DateFormFieldProps {
  /** Already translated copy. */
  label: string;
  text: string;
  value: string;
  error?: string;
  helperText: string;
  accessibilityLabel: string;
  disabled: boolean;
  showLastUsedDate?: boolean;
  onChange: (text: string) => void;
}

/** Labelled wrapper around the shared quick date selector used by forms. */
export function DateFormField({
  label,
  text,
  value,
  error,
  helperText,
  accessibilityLabel,
  disabled,
  showLastUsedDate = false,
  onChange,
}: DateFormFieldProps) {
  return (
    <>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <DateQuickSelector
        text={text}
        valueIso={value}
        error={error}
        disabled={disabled}
        helperText={helperText}
        showLastUsedDate={showLastUsedDate}
        accessibilityLabel={accessibilityLabel}
        onChangeText={onChange}
        onSelectDate={(isoDate) => onChange(formatDateInput(isoDate))}
      />
    </>
  );
}
