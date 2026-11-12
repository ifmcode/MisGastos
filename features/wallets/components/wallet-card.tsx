import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { asTranslate } from "@/shared/i18n/translate";

import { walletCardStyles as styles } from "../styles/wallet-card.styles";
import { Wallet } from "../types/wallet.types";
import { getWalletIconName, getWalletTypeKey } from "../utils/wallet-options";
import { isWalletArchived } from "../utils/wallet-status";

export interface WalletCardProps {
  wallet: Wallet;
  onPress?: (wallet: Wallet) => void;
}

export function WalletCard({ wallet, onPress }: WalletCardProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("wallets");
  const tr = asTranslate(t);
  const locale = useAppLocale();
  const isNegative = wallet.balance < 0;
  const archived = isWalletArchived(wallet);

  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={
        onPress
          ? t(
              archived
                ? "manageArchivedAccessibility"
                : "manageAccessibility",
              { name: wallet.name },
            )
          : undefined
      }
      onPress={onPress ? () => onPress(wallet) : undefined}
      disabled={!onPress}
      style={({ pressed }) => [pressed && onPress ? styles.pressed : null]}
    >
      <ThemedView
        style={[
          styles.card,
          { borderColor: theme.border, backgroundColor: theme.surface },
          archived && styles.archived,
        ]}
      >
        <View
          style={[styles.iconWrapper, { backgroundColor: `${wallet.color}1A` }]}
        >
          <Ionicons
            name={getWalletIconName(wallet.icon)}
            size={22}
            color={wallet.color}
          />
        </View>

        <View style={styles.details}>
          <View style={styles.nameRow}>
            <ThemedText
              type="defaultSemiBold"
              numberOfLines={1}
              style={styles.name}
            >
              {wallet.name}
            </ThemedText>
            {archived ? (
              <View style={styles.badge}>
                <ThemedText style={styles.badgeText}>
                  {t("archivedBadge")}
                </ThemedText>
              </View>
            ) : null}
          </View>
          <ThemedText style={styles.meta} numberOfLines={1}>
            {tr(getWalletTypeKey(wallet.type))} · {wallet.currency}
            {wallet.includeInTotal ? "" : ` · ${t("outsideTotal")}`}
          </ThemedText>
        </View>

        <ThemedText
          type="defaultSemiBold"
          style={[styles.balance, isNegative && { color: theme.danger }]}
          numberOfLines={1}
        >
          {locale.formatCurrency(wallet.balance, wallet.currency)}
        </ThemedText>

        {onPress ? (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.muted}
            style={styles.chevron}
          />
        ) : null}
      </ThemedView>
    </Pressable>
  );
}
