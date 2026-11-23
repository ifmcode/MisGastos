import { SharedExpenseLinkedMovement } from "@/features/shared-expenses/components/shared-expense-linked-movement";
import { SharedExpenseWalletRegistration } from "@/features/shared-expenses/components/shared-expense-wallet-registration";
import { FormActions } from "@/shared/components/molecules/form-actions";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { GroupExpenseEditorController } from "../hooks/use-group-expense-editor";
import type { GroupExpenseFormController } from "../hooks/use-group-expense-form";
import type { GroupExpenseValidationCode } from "../schemas/group-expense.schema";
import { isGroupExpenseWalletRegistrationVisible } from "../utils/group-expense-form";
import { GroupExpenseFormMainFields } from "./group-expense-form-main-fields";
import { GroupExpenseGroupField } from "./group-expense-group-field";
import { GroupExpenseParticipantsField } from "./group-expense-participants-field";
import { GroupExpensePayerSelector } from "./group-expense-payer-selector";
import { GroupExpenseSplitSection } from "./group-expense-split-section";

export interface GroupExpenseFormBodyProps {
  form: GroupExpenseFormController;
  editor: GroupExpenseEditorController;
  error: string | null;
  submitting: boolean;
  isEditing: boolean;
  onCancel: () => void;
}

/** Scrollable body of the group-expense form: fields, shares and actions. */
export function GroupExpenseFormBody({
  form,
  editor,
  error,
  submitting,
  isEditing,
  onCancel,
}: GroupExpenseFormBodyProps) {
  const { t, tr } = useScopedTranslation("groupExpenses");
  const { values, errors } = form;
  // Only the payer owns the mirror movement, so another member's expense shows
  // neither the toggle nor the wallet/category block.
  const canRegisterInWallet = isGroupExpenseWalletRegistrationVisible(
    values.payerId,
    values.viewerUid,
  );
  const hasFieldError = Object.values(errors).some(Boolean);
  // A server error is specific and must be visible next to the button; a field
  // error already has its inline message, so the notice only reminds the user.
  const notice = error ?? (hasFieldError ? t("form.validationSummary") : null);

  function errorText(code: GroupExpenseValidationCode | undefined) {
    return code ? tr(`errors.${code}`) : null;
  }

  return (
    <>
      <GroupExpenseGroupField
        groupName={editor.groupName}
        locked={editor.groupLocked}
        disabled={submitting}
        errorText={errorText(errors.groupId)}
        onOpenPicker={editor.openGroupPicker}
      />

      <GroupExpenseFormMainFields
        values={values}
        errors={errors}
        disabled={submitting}
        onDescriptionChange={form.changeDescription}
        onAmountChange={form.changeAmount}
        onCurrencyChange={form.changeCurrency}
        onDateSelect={form.selectDate}
      />

      <GroupExpenseParticipantsField
        members={editor.members}
        viewerUid={values.viewerUid}
        participantIds={values.participantIds}
        disabled={submitting}
        errorText={errorText(errors.participants)}
        onToggle={form.toggleParticipant}
      />

      <GroupExpensePayerSelector
        members={editor.members}
        viewerUid={values.viewerUid}
        payerId={values.payerId}
        errorText={errorText(errors.payerId)}
        disabled={submitting}
        onChange={form.changePayer}
      />

      <GroupExpenseSplitSection
        mode={values.splitMode}
        currency={values.currency}
        amountText={values.amount}
        members={editor.members}
        viewerUid={values.viewerUid}
        participantIds={values.participantIds}
        values={values.splitValues[values.splitMode]}
        errorText={errorText(errors.participants)}
        modeErrorText={errorText(errors.splitMode)}
        disabled={submitting}
        onModeChange={form.changeSplitMode}
        onValueChange={form.changeSplitValue}
      />

      {canRegisterInWallet ? (
        <SharedExpenseWalletRegistration
          scope="groupExpenses"
          enabled={values.registerInWallet}
          disabled={submitting}
          onChange={form.changeRegisterInWallet}
        />
      ) : null}

      {canRegisterInWallet && values.registerInWallet ? (
        <SharedExpenseLinkedMovement
          scope="groupExpenses"
          wallets={editor.wallets}
          categories={editor.categories}
          payerId={values.payerId}
          viewerUid={values.viewerUid}
          currency={values.currency}
          walletId={values.walletId}
          categoryId={values.categoryId}
          disabled={submitting}
          errors={errors}
          onWalletChange={form.changeWallet}
          onCategoryChange={form.changeCategory}
        />
      ) : null}

      <ErrorBanner message={notice} />

      <FormActions
        submitting={submitting}
        isEditing={isEditing}
        cancelLabel={t("form.cancel")}
        cancelAccessibilityLabel={t("form.cancelAccessibility")}
        submitLabel={t("form.save")}
        submitAccessibilityLabel={t("form.saveAccessibility")}
        onCancel={onCancel}
        onSubmit={form.submit}
      />
    </>
  );
}
