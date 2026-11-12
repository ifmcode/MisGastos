import { useTranslation } from "react-i18next";
import { TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import {
  WALLET_DESCRIPTION_MAX_LENGTH,
  type WalletValidationCode,
} from "../schemas/wallet.schema";
import { walletFormStyles as styles } from "../styles/wallet-form.styles";

export interface WalletFormDescriptionFieldProps {
  value: string;
  error?: WalletValidationCode;
  disabled: boolean;
  onChange: (value: string) => void;
}

export function WalletFormDescriptionField({
  value,
  error,
  disabled,
  onChange,
}: WalletFormDescriptionFieldProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["wallets", "validation"]);
  const errorText = error
    ? t(`validation:wallets.${error}`, {
        max: WALLET_DESCRIPTION_MAX_LENGTH,
      })
    : null;

  return (
    <View>
      <ThemedText style={styles.label}>{t("form.description")}</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={t("form.descriptionPlaceholder")}
        placeholderTextColor={theme.muted}
        maxLength={WALLET_DESCRIPTION_MAX_LENGTH}
        editable={!disabled}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        accessibilityLabel={t("form.descriptionAccessibility")}
        style={[
          styles.input,
          styles.textArea,
          {
            backgroundColor: theme.surface,
            borderColor: error ? theme.danger : theme.border,
            color: theme.text,
          },
        ]}
      />
      <View style={styles.descriptionFooter}>
        {errorText ? (
          <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
            {errorText}
          </ThemedText>
        ) : (
          <View />
        )}
        <ThemedText style={[styles.counter, { color: theme.muted }]}>
          {value.length}/{WALLET_DESCRIPTION_MAX_LENGTH}
        </ThemedText>
      </View>
    </View>
  );
}
