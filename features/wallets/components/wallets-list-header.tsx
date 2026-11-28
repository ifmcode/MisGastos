import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import type { WalletReorder } from "../hooks/use-wallet-reorder";
import { walletsStyles as styles } from "../styles/wallets.styles";
import { WalletTotal } from "../utils/money";
import { WalletReorderToggle } from "./wallet-reorder-toggle";
import { WalletSummary } from "./wallet-summary";

export interface WalletsListHeaderProps {
  totals: WalletTotal[];
  /** Reordering needs at least two active wallets to move. */
  canReorder: boolean;
  reorder: WalletReorder;
}

/** Summary card plus the reorder toggle, its hint and its error. */
export function WalletsListHeader({
  totals,
  canReorder,
  reorder,
}: WalletsListHeaderProps) {
  const { t } = useTranslation("wallets");

  // Keep the toggle while reordering: if the list drops below two active
  // wallets mid-mode, it is the only way out.
  const showToggle = canReorder || reorder.reordering;

  if (totals.length === 0 && !showToggle) return null;

  return (
    <View>
      {totals.length > 0 ? <WalletSummary totals={totals} /> : null}

      {showToggle ? (
        <View style={styles.reorderHeaderRow}>
          <WalletReorderToggle
            reordering={reorder.reordering}
            saving={reorder.saving}
            onPress={reorder.toggleReorder}
          />
        </View>
      ) : null}

      {reorder.reordering ? (
        <ThemedText style={styles.reorderHint}>{t("reorder.hint")}</ThemedText>
      ) : null}

      {reorder.error ? (
        <ThemedText style={styles.reorderError}>{reorder.error}</ThemedText>
      ) : null}
    </View>
  );
}
