import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { useWalletForm } from "../hooks/use-wallet-form";
import { WalletInput, WalletValidationErrors } from "../schemas/wallet.schema";
import { walletFormStyles as styles } from "../styles/wallet-form.styles";
import { WalletFormValues } from "../types/wallet.types";
import { WalletFormActions } from "./wallet-form-actions";
import { WalletFormAppearance } from "./wallet-form-appearance";
import { WalletFormDescriptionField } from "./wallet-form-description-field";
import { WalletFormDetails } from "./wallet-form-details";
import { WalletFormHeader } from "./wallet-form-header";

export interface WalletFormProps {
  mode?: "create" | "edit";
  initialValues?: WalletFormValues;
  initialBalanceLocked?: boolean;
  submitting: boolean;
  error?: string | null;
  fieldErrors?: WalletValidationErrors;
  onSubmit: (input: WalletInput) => void;
  onCancel: () => void;
}

export function WalletForm({
  mode = "create",
  initialValues,
  initialBalanceLocked = false,
  submitting,
  error,
  fieldErrors = {},
  onSubmit,
  onCancel,
}: WalletFormProps) {
  const theme = useFormTheme();
  const { values, errors, updateValue, submit } = useWalletForm({
    fieldErrors,
    initialValues,
    onSubmit,
  });

  const currencyLocked = mode === "edit";

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
          <WalletFormHeader
            mode={mode}
            disabled={submitting}
            onClose={onCancel}
          />

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ErrorBanner message={error} />

            <WalletFormDetails
              values={values}
              errors={errors}
              disabled={submitting}
              initialBalanceLocked={initialBalanceLocked}
              onChange={updateValue}
            />

            <WalletFormAppearance
              values={values}
              errors={errors}
              disabled={submitting}
              currencyLocked={currencyLocked}
              onChange={updateValue}
            />

            <WalletFormDescriptionField
              value={values.description}
              error={errors.description}
              disabled={submitting}
              onChange={(value) => updateValue("description", value)}
            />

            <WalletFormActions
              mode={mode}
              submitting={submitting}
              onCancel={onCancel}
              onSubmit={submit}
            />
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
