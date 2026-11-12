import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { DateQuickSelector } from "@/shared/components/molecules/date-quick-selector";
import { formatDateInput } from "@/shared/utils/date";

import { transferFormStyles as styles } from "../styles/transfer-form.styles";

export interface TransferFormDateFieldProps {
  text: string;
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (text: string) => void;
}

export function TransferFormDateField({
  text,
  value,
  error,
  disabled,
  onChange,
}: TransferFormDateFieldProps) {
  const { t } = useTranslation("transfers");

  return (
    <>
      <ThemedText style={styles.label}>{t("form.date")}</ThemedText>
      <DateQuickSelector
        text={text}
        valueIso={value}
        error={error}
        disabled={disabled}
        helperText={t("form.dateHelper")}
        showLastUsedDate
        accessibilityLabel={t("form.dateAccessibility")}
        onChangeText={onChange}
        onSelectDate={(isoDate) => onChange(formatDateInput(isoDate))}
      />
    </>
  );
}
