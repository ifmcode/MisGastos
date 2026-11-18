import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import type { Category } from "@/features/categories/types/category.types";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import { FormHeader } from "@/shared/components/molecules/form-header";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { useSettlementForm } from "../hooks/use-settlement-form";
import type { SettlementFieldErrors } from "../schemas/settlement-validation.types";
import { settlementsStyles as styles } from "../styles/settlements.styles";
import type { SettlementInput } from "../types/settlement.types";
import type {
  SettlementCurrencyOption,
  SettlementFormValues,
} from "../utils/settlement-form";
import { SettlementFormBody } from "./settlement-form-body";

export interface SettlementFormProps {
  initialValues: SettlementFormValues;
  /** Currencies with a debt; in edit mode it carries the editable bound. */
  options: readonly SettlementCurrencyOption[];
  friendName: string;
  /** Bound used when `options` has no entry for the selected currency. */
  debtCents: number;
  viewerIsCreditor: boolean;
  wallets: readonly Wallet[];
  categories: readonly Category[];
  fieldErrors: SettlementFieldErrors;
  error: string | null;
  submitting: boolean;
  isEditing: boolean;
  amountLocked: boolean;
  onSubmit: (input: SettlementInput) => void;
  onCancel: () => void;
}

/**
 * Page sheet of the settlement form. Create and edit share it; the edit modal
 * only changes the copy, the locked fields and the amount bound.
 */
export function SettlementForm({
  initialValues,
  options,
  friendName,
  debtCents,
  viewerIsCreditor,
  wallets,
  categories,
  fieldErrors,
  error,
  submitting,
  isEditing,
  amountLocked,
  onSubmit,
  onCancel,
}: SettlementFormProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("settlements");
  const form = useSettlementForm({
    initialValues,
    options,
    debtCents,
    viewerIsCreditor,
    categories,
    fieldErrors,
    onSubmit,
  });

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ThemedView
          style={styles.container}
          lightColor={theme.background}
          darkColor={theme.background}
        >
          <FormHeader
            title={isEditing ? t("form.editTitle") : t("form.createTitle")}
            subtitle={t("form.subtitle", { name: friendName })}
            closeAccessibilityLabel={t("form.closeAccessibility")}
            disabled={submitting}
            onClose={onCancel}
          />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <SettlementFormBody
              form={form}
              options={options}
              isEditing={isEditing}
              amountLocked={amountLocked}
              wallets={wallets}
              categories={categories}
              error={error}
              submitting={submitting}
              onCancel={onCancel}
            />
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
