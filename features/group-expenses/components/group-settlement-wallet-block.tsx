import { useMemo, useState } from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { Category } from "@/features/categories/types/category.types";
import {
  getSettlementIncomeCategoryOptions,
  getSettlementWalletChoices,
} from "@/features/settlements/utils/settlement-form-options";
import { WalletPickerDialog } from "@/features/wallets/components/wallet-picker-dialog";
import { WalletSelectButton } from "@/features/wallets/components/wallet-select-button";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import { isWalletArchived } from "@/features/wallets/utils/wallet-status";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { GroupSettlementFormController } from "../hooks/use-group-settlement-form";
import { groupExpensesStyles as styles } from "../styles/group-expenses.styles";
import { GroupSettlementCategoryField } from "./group-settlement-category-field";

export interface GroupSettlementWalletBlockProps {
  form: GroupSettlementFormController;
  wallets: readonly Wallet[];
  categories: readonly Category[];
  viewerIsCreditor: boolean;
  disabled: boolean;
}

/**
 * Creditor-only movement block: one optional active wallet of the settlement
 * currency plus the income category that appears once a wallet is selected. The
 * debtor never links either, so they only read the neutral hint.
 */
export function GroupSettlementWalletBlock({
  form,
  wallets,
  categories,
  viewerIsCreditor,
  disabled,
}: GroupSettlementWalletBlockProps) {
  const theme = useFormTheme();
  const { t, tr } = useScopedTranslation("groupExpenses");
  const [pickerVisible, setPickerVisible] = useState(false);
  const { values, errors } = form;
  const walletId = values.walletId.trim();
  const hasWallet = walletId.length > 0;
  const choices = useMemo(
    () => getSettlementWalletChoices(wallets, values.currency, walletId),
    [values.currency, walletId, wallets],
  );
  const selectedWallet =
    wallets.find((wallet) => wallet.id === walletId) ?? null;
  const archived = selectedWallet ? isWalletArchived(selectedWallet) : false;
  const categoryOptions = useMemo(
    () =>
      hasWallet
        ? getSettlementIncomeCategoryOptions(categories, values.categoryId)
        : [],
    [categories, hasWallet, values.categoryId],
  );

  if (!viewerIsCreditor) {
    return (
      <ThemedText style={[styles.helper, { color: theme.muted }]}>
        {t("settlementForm.debtorHint")}
      </ThemedText>
    );
  }

  function select(id: string) {
    form.changeWallet(id);
    setPickerVisible(false);
  }

  return (
    <View>
      <ThemedText style={styles.label}>
        {t("settlementForm.walletLabel")}
      </ThemedText>

      <WalletSelectButton
        wallet={selectedWallet}
        disabled={disabled}
        hasError={Boolean(errors.walletId)}
        accessibilityPrefix={t("settlementForm.walletGroupAccessibility")}
        onPress={() => setPickerVisible(true)}
      />

      {choices.length === 0 ? (
        <ThemedText style={[styles.helper, { color: theme.muted }]}>
          {t("settlementForm.walletEmpty", { currency: values.currency })}
        </ThemedText>
      ) : null}

      <ThemedText style={[styles.helper, { color: theme.muted }]}>
        {t("settlementForm.walletHint")}
      </ThemedText>

      {archived ? (
        <ThemedText style={[styles.fieldError, { color: theme.warning }]}>
          {t("settlementForm.walletArchivedHint")}
        </ThemedText>
      ) : null}

      {errors.walletId ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {tr(`errors.${errors.walletId}`)}
        </ThemedText>
      ) : null}

      {hasWallet ? (
        <GroupSettlementCategoryField
          options={categoryOptions}
          selectedId={values.categoryId}
          disabled={disabled}
          error={errors.categoryId}
          onChange={form.changeCategory}
        />
      ) : (
        <ThemedText style={[styles.helper, { color: theme.muted }]}>
          {t("settlementForm.receiverHint")}
        </ThemedText>
      )}

      <WalletPickerDialog
        visible={pickerVisible}
        wallets={choices}
        selectedId={walletId}
        disabled={disabled}
        accessibilityPrefix={t("settlementForm.walletGroupAccessibility")}
        noneOption={{
          label: t("settlementForm.walletNone"),
          accessibilityLabel: t("settlementForm.walletNoneAccessibility"),
        }}
        onSelect={select}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}
