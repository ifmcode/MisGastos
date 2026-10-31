import { Ionicons } from "@expo/vector-icons";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { useWalletForm } from "../hooks/use-wallet-form";
import { WalletInput, WalletValidationErrors } from "../schemas/wallet.schema";
import { walletFormStyles as styles } from "../styles/wallet-form.styles";
import { WalletFormActions } from "./wallet-form-actions";
import { WalletFormAppearance } from "./wallet-form-appearance";
import { WalletFormDescriptionField } from "./wallet-form-description-field";
import { WalletFormDetails } from "./wallet-form-details";
import { WalletFormHeader } from "./wallet-form-header";

export interface WalletFormProps {
  submitting: boolean;
  error?: string | null;
  fieldErrors?: WalletValidationErrors;
  onSubmit: (input: WalletInput) => void;
  onCancel: () => void;
}

export function WalletForm({
  submitting,
  error,
  fieldErrors = {},
  onSubmit,
  onCancel,
}: WalletFormProps) {
  const theme = useFormTheme();
  const { values, errors, updateValue, submit } = useWalletForm({
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
          <WalletFormHeader disabled={submitting} onClose={onCancel} />

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons
                  name="alert-circle"
                  size={20}
                  color={theme.danger}
                />
                <ThemedText style={styles.errorBannerText}>{error}</ThemedText>
              </View>
            ) : null}

            <WalletFormDetails
              values={values}
              errors={errors}
              disabled={submitting}
              onChange={updateValue}
            />

            <WalletFormAppearance
              values={values}
              errors={errors}
              disabled={submitting}
              onChange={updateValue}
            />

            <WalletFormDescriptionField
              value={values.description}
              error={errors.description}
              disabled={submitting}
              onChange={(value) => updateValue("description", value)}
            />

            <WalletFormActions
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
