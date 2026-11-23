import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { Category } from "@/features/categories/types/category.types";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import { FormActions } from "@/shared/components/molecules/form-actions";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { GroupSettlementFormController } from "../hooks/use-group-settlement-form";
import { groupSettlementsStyles as styles } from "../styles/group-settlements.styles";
import { GroupSettlementDebtCard } from "./group-settlement-debt-card";
import { GroupSettlementMainFields } from "./group-settlement-main-fields";
import { GroupSettlementWalletBlock } from "./group-settlement-wallet-block";
import type { GroupSettlementDirection } from "../utils/group-settlement-form.types";

export interface GroupSettlementFormBodyProps {
  form: GroupSettlementFormController;
  groupName: string;
  fromName: string;
  toName: string;
  currencyLabel: string;
  /** Already formatted pair debt the card shows. */
  debtAmount: string;
  direction: GroupSettlementDirection;
  isEditing: boolean;
  amountLocked: boolean;
  viewerIsCreditor: boolean;
  wallets: readonly Wallet[];
  categories: readonly Category[];
  /** Already translated notice of the last failed save. */
  error: string | null;
  submitting: boolean;
  onCancel: () => void;
}

/**
 * Debt card, fields, creditor movement block, notice and actions of the group
 * settlement form. A field summary uses the warning tone; a server failure
 * keeps the danger tone and never repeats the field error.
 */
export function GroupSettlementFormBody({
  form,
  groupName,
  fromName,
  toName,
  currencyLabel,
  debtAmount,
  direction,
  isEditing,
  amountLocked,
  viewerIsCreditor,
  wallets,
  categories,
  error,
  submitting,
  onCancel,
}: GroupSettlementFormBodyProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation(["groupExpenses", "common"]);
  const { errors, amountIssue, dateIssue } = form;
  const hasFieldError =
    Object.values(errors).some(Boolean) ||
    Boolean(amountIssue) ||
    Boolean(dateIssue);
  const notice = error ?? (hasFieldError ? t("settlementForm.validationSummary") : null);
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
      <GroupSettlementDebtCard
        groupName={groupName}
        fromName={fromName}
        toName={toName}
        currencyLabel={currencyLabel}
        amount={debtAmount}
        direction={direction}
      />

      <GroupSettlementMainFields
        form={form}
        amountLocked={amountLocked}
        disabled={submitting}
      />

      <GroupSettlementWalletBlock
        form={form}
        wallets={wallets}
        categories={categories}
        viewerIsCreditor={viewerIsCreditor}
        disabled={submitting}
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
          <ThemedText style={[styles.formNoticeText, { color: noticeTone.text }]}>
            {notice}
          </ThemedText>
        </View>
      ) : null}

      <FormActions
        submitting={submitting}
        isEditing={isEditing}
        canSubmit={!amountIssue && !dateIssue}
        cancelLabel={t("settlementForm.cancel")}
        cancelAccessibilityLabel={t("settlementForm.cancelAccessibility")}
        submitLabel={
          isEditing ? t("common:actions.saveChanges") : t("settlementForm.save")
        }
        submitAccessibilityLabel={t("settlementForm.saveAccessibility")}
        onCancel={onCancel}
        onSubmit={form.submit}
      />
    </>
  );
}
