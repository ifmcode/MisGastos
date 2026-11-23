import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { FriendDetailBalanceLine } from "@/features/friends/utils/friend-detail";
import { SettleButton } from "@/shared/components/molecules/settle-button";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { friendDetailStyles as styles } from "../styles/friend-detail.styles";

export interface FriendDetailBalancesProps {
  /** One line per currency; empty means the pair is settled. */
  balances: readonly FriendDetailBalanceLine[];
  /** Friend name used by the settle action label. */
  name: string;
  /** Opens the settlement form for the pair debt. */
  onSettle: () => void;
}

/**
 * Per-currency debts of the pair plus the settle action. Currencies are never
 * converted, so each debt keeps its own line.
 */
export function FriendDetailBalances({
  balances,
  name,
  onSettle,
}: FriendDetailBalancesProps) {
  const theme = useFormTheme();
  const locale = useAppLocale();
  const { t } = useTranslation(["friends", "settlements"]);

  return (
    <>
      <View style={styles.balances}>
        {balances.length === 0 ? (
          <ThemedText style={[styles.balanceLine, { color: theme.muted }]}>
            {t("friends:balance.settled")}
          </ThemedText>
        ) : (
          balances.map((line) => {
            const owesViewer = line.direction === "friend-owes-viewer";
            const amount = locale.formatCurrency(line.amount, line.currency);
            const label = owesViewer
              ? t("friends:balance.owesYou", { amount })
              : t("friends:balance.youOwe", { amount });

            return (
              <ThemedText
                key={line.currency}
                style={[
                  styles.balanceLine,
                  { color: owesViewer ? theme.success : theme.danger },
                ]}
              >
                {label}
              </ThemedText>
            );
          })
        )}
      </View>

      {balances.length > 0 ? (
        <SettleButton
          label={t("settlements:friendDetail.settle")}
          accessibilityLabel={t("settlements:friendDetail.settleAccessibility", {
            name,
          })}
          accessibilityHint={t("settlements:friendDetail.settleHint")}
          icon="swap-horizontal-outline"
          onPress={onSettle}
        />
      ) : null}
    </>
  );
}
