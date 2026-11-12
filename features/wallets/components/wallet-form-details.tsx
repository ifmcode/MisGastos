import { useTranslation } from "react-i18next";
import { TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import {
  WalletValidationErrors,
  WALLET_NAME_MAX_LENGTH,
} from "../schemas/wallet.schema";
import { walletFormStyles as styles } from "../styles/wallet-form.styles";
import { WalletFormValues } from "../types/wallet.types";
import { getCurrencySymbol } from "../utils/money";

export interface WalletFormDetailsProps {
  values: WalletFormValues;
  errors: WalletValidationErrors;
  disabled: boolean;
  initialBalanceLocked?: boolean;
  onChange: <K extends keyof WalletFormValues>(
    key: K,
    value: WalletFormValues[K],
  ) => void;
}

export function WalletFormDetails({
  values,
  errors,
  disabled,
  initialBalanceLocked = false,
  onChange,
}: WalletFormDetailsProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["wallets", "validation"]);

  const nameError = errors.name
    ? t(`validation:wallets.${errors.name}`, { max: WALLET_NAME_MAX_LENGTH })
    : null;
  const balanceError = errors.initialBalance
    ? t(`validation:wallets.${errors.initialBalance}`)
    : null;

  return (
    <View>
      <ThemedText style={styles.label}>{t("form.name")}</ThemedText>
      <TextInput
        value={values.name}
        onChangeText={(value) => onChange("name", value)}
        placeholder={t("form.namePlaceholder")}
        placeholderTextColor={theme.muted}
        maxLength={WALLET_NAME_MAX_LENGTH}
        editable={!disabled}
        accessibilityLabel={t("form.nameAccessibility")}
        style={[
          styles.input,
          {
            backgroundColor: theme.surface,
            borderColor: errors.name ? theme.danger : theme.border,
            color: theme.text,
          },
        ]}
      />
      {nameError ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {nameError}
        </ThemedText>
      ) : null}

      <ThemedText style={styles.label}>{t("form.initialBalance")}</ThemedText>
      <View
        style={[
          styles.balanceWrapper,
          {
            backgroundColor: theme.surface,
            borderColor: errors.initialBalance ? theme.danger : theme.border,
          },
        ]}
      >
        <ThemedText style={[styles.balanceSymbol, { color: theme.muted }]}>
          {getCurrencySymbol(values.currency)}
        </ThemedText>
        <TextInput
          value={values.initialBalance}
          onChangeText={(value) => onChange("initialBalance", value)}
          placeholder={t("form.amountPlaceholder")}
          placeholderTextColor={theme.muted}
          keyboardType="decimal-pad"
          inputMode="decimal"
          editable={!disabled && !initialBalanceLocked}
          accessibilityLabel={t("form.initialBalance")}
          style={[
            styles.balanceInput,
            { color: theme.text },
            initialBalanceLocked && styles.disabled,
          ]}
        />
      </View>
      {balanceError ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {balanceError}
        </ThemedText>
      ) : (
        <ThemedText style={[styles.helper, { color: theme.muted }]}>
          {initialBalanceLocked
            ? t("form.initialBalanceLocked")
            : t("form.initialBalanceHint")}
        </ThemedText>
      )}
    </View>
  );
}
