import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { asTranslate } from "@/shared/i18n/translate";

import { walletPickerStyles as styles } from "../styles/wallet-picker.styles";
import { Wallet } from "../types/wallet.types";
import { getWalletIconName, getWalletTypeKey } from "../utils/wallet-options";

export interface WalletPickerOptionProps {
  wallet: Wallet;
  selected: boolean;
  disabled: boolean;
  /** Screen-reader context, already translated by the caller. */
  accessibilityPrefix: string;
  onSelect: (walletId: string) => void;
}

/** One selectable row inside the wallet popup. It shows enough data to tell
 * wallets apart even when they share a type or currency. */
export function WalletPickerOption({
  wallet,
  selected,
  disabled,
  accessibilityPrefix,
  onSelect,
}: WalletPickerOptionProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("wallets");
  const tr = asTranslate(t);
  const locale = useAppLocale();
  const typeLabel = tr(getWalletTypeKey(wallet.type));
  const balance = locale.formatCurrency(wallet.balance, wallet.currency);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={t("picker.optionAccessibility", {
        prefix: accessibilityPrefix,
        name: wallet.name,
        type: typeLabel,
        currency: wallet.currency,
        balance,
      })}
      onPress={() => onSelect(wallet.id)}
      disabled={disabled}
      style={({ pressed }) => [
        styles.option,
        {
          backgroundColor: selected ? theme.primarySoft : theme.surface,
          borderColor: selected ? theme.primary : theme.border,
        },
        pressed && styles.optionPressed,
      ]}
    >
      <View
        style={[styles.optionIcon, { backgroundColor: `${wallet.color}1A` }]}
      >
        <Ionicons
          name={getWalletIconName(wallet.icon)}
          size={20}
          color={wallet.color}
        />
      </View>

      <View style={styles.optionText}>
        <ThemedText
          type="defaultSemiBold"
          numberOfLines={1}
          style={[
            styles.optionName,
            { color: selected ? theme.primary : theme.text },
          ]}
        >
          {wallet.name}
        </ThemedText>
        <ThemedText
          style={[styles.optionMeta, { color: theme.muted }]}
          numberOfLines={1}
        >
          {typeLabel} · {wallet.currency}
        </ThemedText>
      </View>

      <View style={styles.optionAmounts}>
        <ThemedText
          style={[
            styles.optionBalance,
            { color: wallet.balance < 0 ? theme.danger : theme.text },
          ]}
        >
          {balance}
        </ThemedText>
        {selected ? (
          <Ionicons name="checkmark" size={18} color={theme.primary} />
        ) : null}
      </View>
    </Pressable>
  );
}
