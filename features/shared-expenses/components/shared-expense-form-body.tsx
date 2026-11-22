import type { Category } from "@/features/categories/types/category.types";
import type { Friend } from "@/features/friends/types/friend.types";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import { FormActions } from "@/shared/components/molecules/form-actions";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { SharedExpenseFormController } from "../hooks/use-shared-expense-form";
import { isSharedExpenseWalletRegistrationVisible } from "../utils/shared-expense-form";
import {
  SharedExpenseFriendField,
  type SharedExpenseFriendLockReason,
} from "./shared-expense-friend-field";
import { SharedExpenseFormMainFields } from "./shared-expense-form-main-fields";
import { SharedExpenseFormNotice } from "./shared-expense-form-notice";
import { SharedExpenseFormParticipants } from "./shared-expense-form-participants";
import { SharedExpenseLinkedMovement } from "./shared-expense-linked-movement";
import { SharedExpenseWalletRegistration } from "./shared-expense-wallet-registration";

export interface SharedExpenseFormBodyProps {
  /** Value state and change handlers owned by the page-sheet shell. */
  form: SharedExpenseFormController;
  friends: readonly Friend[];
  wallets: readonly Wallet[];
  categories: readonly Category[];
  error: string | null;
  submitting: boolean;
  isEditing: boolean;
  /** Editing locks the pair; a create entry point preselects the friend. */
  locked: boolean;
  lockedReason: SharedExpenseFriendLockReason;
  onCancel: () => void;
}

/** Scrollable body of the shared-expense form: fields, movement and actions. */
export function SharedExpenseFormBody({
  form,
  friends,
  wallets,
  categories,
  error,
  submitting,
  isEditing,
  locked,
  lockedReason,
  onCancel,
}: SharedExpenseFormBodyProps) {
  const { t } = useScopedTranslation("sharedExpenses");
  const { values, errors } = form;
  // Only the payer owns the movement, so a friend-paid expense shows neither
  // the toggle nor the wallet/category block.
  const canRegisterInWallet = isSharedExpenseWalletRegistrationVisible(
    values.payerId,
    values.viewerUid,
  );
  const hasFieldError = Object.values(errors).some(Boolean);
  // A server error is specific and must be visible next to the button; a field
  // error already has its own inline message, so the notice only reminds the
  // user to review the highlighted fields instead of repeating the same text.
  const notice = error ?? (hasFieldError ? t("form.validationSummary") : null);

  return (
    <>
      <SharedExpenseFriendField
        friends={friends}
        selectedUid={values.friendUid}
        locked={locked}
        lockedReason={lockedReason}
        onSelect={form.changeFriend}
      />

      <SharedExpenseFormMainFields
        values={values}
        errors={errors}
        disabled={submitting}
        onDescriptionChange={form.changeDescription}
        onAmountChange={form.changeAmount}
        onCurrencyChange={form.changeCurrency}
        onDateSelect={form.selectDate}
      />

      <SharedExpenseFormParticipants
        friends={friends}
        values={values}
        errors={errors}
        disabled={submitting}
        onPayerChange={form.changePayer}
        onSplitModeChange={form.changeSplitMode}
        onSplitValueChange={form.changeSplitValue}
      />

      {canRegisterInWallet ? (
        <SharedExpenseWalletRegistration
          enabled={values.registerInWallet}
          disabled={submitting}
          onChange={form.changeRegisterInWallet}
        />
      ) : null}

      {canRegisterInWallet && values.registerInWallet ? (
        <SharedExpenseLinkedMovement
          wallets={wallets}
          categories={categories}
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

      {notice ? (
        <SharedExpenseFormNotice
          text={notice}
          tone={error ? "error" : "notice"}
        />
      ) : null}

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
