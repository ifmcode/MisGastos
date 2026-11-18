import { useMemo } from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { Category } from "@/features/categories/types/category.types";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { SettlementFormController } from "../hooks/use-settlement-form";
import { settlementsStyles as styles } from "../styles/settlements.styles";
import { getSettlementIncomeCategoryOptions } from "../utils/settlement-form-options";
import { SettlementFormCategoryChips } from "./settlement-form-category-chips";
import { SettlementFormWalletSelector } from "./settlement-form-wallet-selector";

export interface SettlementFormWalletBlockProps {
  form: SettlementFormController;
  wallets: readonly Wallet[];
  categories: readonly Category[];
  disabled: boolean;
}

/**
 * Creditor-only movement block: the optional wallet plus the income category
 * that appears once a wallet is selected. The debtor never links either.
 */
export function SettlementFormWalletBlock({
  form,
  wallets,
  categories,
  disabled,
}: SettlementFormWalletBlockProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("settlements");
  const { values, errors } = form;
  const hasWallet = values.walletId.trim().length > 0;
  const categoryOptions = useMemo(
    () =>
      hasWallet
        ? getSettlementIncomeCategoryOptions(categories, values.categoryId)
        : [],
    [categories, hasWallet, values.categoryId],
  );

  if (!form.resolvedCreditor) {
    return (
      <ThemedText style={[styles.helper, { color: theme.muted }]}>
        {t("form.debtorHint")}
      </ThemedText>
    );
  }

  return (
    <View>
      <SettlementFormWalletSelector
        wallets={wallets}
        currency={values.currency}
        selectedId={values.walletId}
        disabled={disabled}
        error={errors.walletId}
        onChange={form.changeWallet}
      />

      {hasWallet ? (
        <SettlementFormCategoryChips
          options={categoryOptions}
          selectedId={values.categoryId}
          disabled={disabled}
          error={errors.categoryId}
          onChange={form.changeCategory}
        />
      ) : (
        <ThemedText style={[styles.helper, { color: theme.muted }]}>
          {t("form.receiverHint")}
        </ThemedText>
      )}
    </View>
  );
}
