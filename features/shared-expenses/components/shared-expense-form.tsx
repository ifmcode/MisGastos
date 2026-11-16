import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import type { Friend } from "@/features/friends/types/friend.types";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { FormActions } from "@/shared/components/molecules/form-actions";
import { FormHeader } from "@/shared/components/molecules/form-header";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { useSharedExpenseForm } from "../hooks/use-shared-expense-form";
import type {
  SharedExpenseFieldErrors,
  SharedExpenseValidationCode,
} from "../schemas/shared-expense.schema";
import { sharedExpensesStyles as styles } from "../styles/shared-expenses.styles";
import type { SharedExpenseInput } from "../types/shared-expense.types";
import type { SharedExpenseFormValues } from "../utils/shared-expense-form";
import { getSharedExpenseParticipantName } from "../utils/shared-expense-friends";
import { SharedExpenseFormMainFields } from "./shared-expense-form-main-fields";
import { SharedExpenseFriendField } from "./shared-expense-friend-field";
import { SharedExpensePayerSelector } from "./shared-expense-payer-selector";
import { SharedExpenseSplitSection } from "./shared-expense-split-section";

export interface SharedExpenseFormProps {
  friends: readonly Friend[];
  initialValues: SharedExpenseFormValues;
  fieldErrors: SharedExpenseFieldErrors;
  error: string | null;
  submitting: boolean;
  isEditing: boolean;
  onSubmit: (input: SharedExpenseInput) => void;
  onCancel: () => void;
}

/** Page-sheet body of the shared-expense form; owns its field state. */
export function SharedExpenseForm({
  friends,
  initialValues,
  fieldErrors,
  error,
  submitting,
  isEditing,
  onSubmit,
  onCancel,
}: SharedExpenseFormProps) {
  const theme = useFormTheme();
  const { t, tr } = useScopedTranslation("sharedExpenses");
  const form = useSharedExpenseForm({ initialValues, fieldErrors, onSubmit });
  const { values, errors, submit } = form;

  function errorText(code: SharedExpenseValidationCode | undefined) {
    return code ? tr(`errors.${code}`) : null;
  }

  const friendName = getSharedExpenseParticipantName(
    friends,
    values.friendUid,
    t("friendFallback"),
  );

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
            subtitle={t("form.subtitle")}
            closeAccessibilityLabel={t("form.closeAccessibility")}
            disabled={submitting}
            onClose={onCancel}
          />

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ErrorBanner message={error} />

            <SharedExpenseFriendField
              friends={friends}
              selectedUid={values.friendUid}
              locked={isEditing}
              onSelect={form.changeFriend}
            />

            <SharedExpenseFormMainFields
              values={values}
              errors={errors}
              disabled={submitting}
              onDescriptionChange={form.changeDescription}
              onAmountChange={form.changeAmount}
              onCurrencyChange={form.changeCurrency}
              onDateTextChange={form.changeDateText}
            />

            <SharedExpensePayerSelector
              viewerUid={values.viewerUid}
              friendUid={values.friendUid}
              friendName={friendName}
              payerId={values.payerId}
              errorText={errorText(errors.payerId)}
              disabled={submitting}
              onChange={form.changePayer}
            />

            <SharedExpenseSplitSection
              mode={values.splitMode}
              currency={values.currency}
              viewerUid={values.viewerUid}
              friendUid={values.friendUid}
              friendName={friendName}
              values={values.splitValues[values.splitMode]}
              errorText={errorText(errors.participants)}
              modeErrorText={errorText(errors.splitMode)}
              disabled={submitting}
              onModeChange={form.changeSplitMode}
              onValueChange={form.changeSplitValue}
            />

            <FormActions
              submitting={submitting}
              isEditing={isEditing}
              canSubmit={values.friendUid.trim().length > 0}
              cancelLabel={t("form.cancel")}
              cancelAccessibilityLabel={t("form.cancelAccessibility")}
              submitLabel={t("form.save")}
              submitAccessibilityLabel={t("form.saveAccessibility")}
              onCancel={onCancel}
              onSubmit={submit}
            />
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
