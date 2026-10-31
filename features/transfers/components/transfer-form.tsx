import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { useTransferForm } from "../hooks/use-transfer-form";
import {
  TransferInput,
  TransferValidationErrors,
} from "../schemas/transfer.schema";
import { transferFormStyles as styles } from "../styles/transfer-form.styles";
import { Transfer, TransferFormValues } from "../types/transfer.types";
import { TransferFormActions } from "./transfer-form-actions";
import { TransferFormAmountField } from "./transfer-form-amount-field";
import { TransferFormDateField } from "./transfer-form-date-field";
import { TransferFormDestinationSelector } from "./transfer-form-destination-selector";
import { TransferFormErrorBanner } from "./transfer-form-error-banner";
import { TransferFormHeader } from "./transfer-form-header";
import { TransferFormInfoBanner } from "./transfer-form-info-banner";
import { TransferFormNotesField } from "./transfer-form-notes-field";
import { TransferFormSourceSelector } from "./transfer-form-source-selector";

export interface TransferFormProps {
  submitting: boolean;
  error?: string | null;
  fieldErrors?: TransferValidationErrors;
  wallets: Wallet[];
  initialValues: TransferFormValues;
  isEditing: boolean;
  editingTransfer?: Transfer | null;
  onSubmit: (input: TransferInput) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function TransferForm({
  submitting,
  error,
  fieldErrors = {},
  wallets,
  initialValues,
  isEditing,
  editingTransfer,
  onSubmit,
  onCancel,
  onDelete,
}: TransferFormProps) {
  const theme = useFormTheme();
  const {
    values,
    errors,
    availableDestinations,
    currency,
    symbol,
    amountHelper,
    dateText,
    canSubmit,
    updateValue,
    changeFromWallet,
    changeDate,
    submit,
  } = useTransferForm({
    wallets,
    initialValues,
    editingTransfer,
    fieldErrors,
    onSubmit,
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ThemedView
          style={styles.container}
          lightColor={theme.background}
          darkColor={theme.background}
        >
          <TransferFormHeader
            isEditing={isEditing}
            disabled={submitting}
            onClose={onCancel}
          />

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {error ? <TransferFormErrorBanner message={error} /> : null}

            {wallets.length < 2 ? (
              <TransferFormInfoBanner
                showIcon
                message="Necesitas al menos dos carteras para hacer una transferencia."
              />
            ) : null}

            <TransferFormSourceSelector
              wallets={wallets}
              selectedId={values.fromWalletId}
              error={errors.fromWalletId}
              disabled={submitting}
              onSelect={changeFromWallet}
            />

            <TransferFormDestinationSelector
              destinations={availableDestinations}
              selectedId={values.toWalletId}
              currency={currency}
              error={errors.toWalletId}
              disabled={submitting}
              onSelect={(walletId) => updateValue("toWalletId", walletId)}
            />

            <TransferFormAmountField
              value={values.amount}
              symbol={symbol}
              error={errors.amount}
              helper={amountHelper}
              disabled={submitting}
              onChange={(value) => updateValue("amount", value)}
            />

            <TransferFormDateField
              text={dateText}
              error={errors.date}
              disabled={submitting}
              onChange={changeDate}
            />

            <TransferFormNotesField
              value={values.notes}
              error={errors.notes}
              disabled={submitting}
              onChange={(value) => updateValue("notes", value)}
            />

            <TransferFormActions
              submitting={submitting}
              isEditing={isEditing}
              canSubmit={canSubmit}
              onCancel={onCancel}
              onSubmit={submit}
              onDelete={onDelete}
            />
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
