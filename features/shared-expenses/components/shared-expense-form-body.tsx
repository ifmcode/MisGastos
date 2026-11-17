import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { Category } from "@/features/categories/types/category.types";
import type { Friend } from "@/features/friends/types/friend.types";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import { FormActions } from "@/shared/components/molecules/form-actions";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { SharedExpenseFormController } from "../hooks/use-shared-expense-form";
import { sharedExpensesStyles as styles } from "../styles/shared-expenses.styles";
import { SharedExpenseFormMainFields } from "./shared-expense-form-main-fields";
import { SharedExpenseFormParticipants } from "./shared-expense-form-participants";
import {
  SharedExpenseFriendField,
  type SharedExpenseFriendLockReason,
} from "./shared-expense-friend-field";
import { SharedExpenseLinkedMovement } from "./shared-expense-linked-movement";

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
  const theme = useFormTheme();
  const { values, errors } = form;
  const hasFieldError = Object.values(errors).some(Boolean);
  // A server error is specific and must be visible next to the button; a field
  // error already has its own inline message, so the notice only reminds the
  // user to review the highlighted fields instead of repeating the same text.
  const notice = error ?? (hasFieldError ? t("form.validationSummary") : null);
  // A server error is an error (red); the field summary is only a notice (amber).
  const noticeTone = error
    ? {
        surface: theme.dangerSurface,
        border: theme.danger,
        text: theme.dangerText,
      }
    : {
        surface: theme.warningSurface,
        border: theme.warning,
        text: theme.warningText,
      };

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
        onDateTextChange={form.changeDateText}
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

      {notice ? (
        <View
          accessibilityRole="alert"
          style={[
            styles.formNotice,
            {
              backgroundColor: noticeTone.surface,
              borderColor: noticeTone.border,
            },
          ]}
        >
          <ThemedText
            style={[styles.formNoticeText, { color: noticeTone.text }]}
          >
            {notice}
          </ThemedText>
        </View>
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
