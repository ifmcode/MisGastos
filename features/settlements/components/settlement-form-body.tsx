import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { Category } from "@/features/categories/types/category.types";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import { FormActions } from "@/shared/components/molecules/form-actions";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";
import { formatCurrencyLabel } from "@/shared/utils/currency-label";

import type { SettlementFormController } from "../hooks/use-settlement-form";
import { settlementsStyles as styles } from "../styles/settlements.styles";
import { SettlementFormDebtCard } from "./settlement-form-debt-card";
import { SettlementFormMainFields } from "./settlement-form-main-fields";
import { SettlementFormWalletBlock } from "./settlement-form-wallet-block";

export interface SettlementFormBodyProps {
  form: SettlementFormController;
  isEditing: boolean;
  amountLocked: boolean;
  wallets: readonly Wallet[];
  categories: readonly Category[];
  error: string | null;
  submitting: boolean;
  onCancel: () => void;
}

/** Fields, debtor/creditor block, notice and actions of the settlement form. */
export function SettlementFormBody({
  form,
  isEditing,
  amountLocked,
  wallets,
  categories,
  error,
  submitting,
  onCancel,
}: SettlementFormBodyProps) {
  const theme = useFormTheme();
  const locale = useAppLocale();
  const { t } = useScopedTranslation(["settlements", "common"]);
  const { values, errors, boundCents, resolvedCreditor } = form;
  const amount = locale.formatCurrency(boundCents / 100, values.currency);
  const hasFieldError =
    Object.values(errors).some(Boolean) ||
    Boolean(form.dateIssue) ||
    Boolean(form.amountIssue);
  const notice = error ?? (hasFieldError ? t("form.validationSummary") : null);
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
      <SettlementFormDebtCard
        currencyLabel={formatCurrencyLabel(values.currency)}
        amount={amount}
        viewerIsCreditor={resolvedCreditor}
      />

      <SettlementFormMainFields
        form={form}
        amountLocked={amountLocked}
        disabled={submitting}
      />

      <SettlementFormWalletBlock
        form={form}
        wallets={wallets}
        categories={categories}
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
        canSubmit={!form.amountIssue && !form.dateIssue}
        cancelLabel={t("form.cancel")}
        cancelAccessibilityLabel={t("form.cancelAccessibility")}
        submitLabel={
          isEditing ? t("common:actions.saveChanges") : t("form.save")
        }
        submitAccessibilityLabel={t("form.saveAccessibility")}
        onCancel={onCancel}
        onSubmit={form.submit}
      />
    </>
  );
}
