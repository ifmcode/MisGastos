import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { asTranslate } from "@/shared/i18n/translate";

import {
  walletsPalette,
  walletsStyles as styles,
} from "../styles/wallets.styles";
import {
  getWalletsQuickActions,
  WalletsQuickActionKey,
} from "../utils/wallets-quick-actions";

export interface WalletsQuickActionsProps {
  canTransfer: boolean;
  onTransferPress: () => void;
  onHistoryPress: () => void;
}

/** Compact row above the wallet list with the transfer and history actions. */
export function WalletsQuickActions({
  canTransfer,
  onTransferPress,
  onHistoryPress,
}: WalletsQuickActionsProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("wallets");
  const tr = asTranslate(t);
  const actions = getWalletsQuickActions(canTransfer);
  const handlers: Record<WalletsQuickActionKey, () => void> = {
    transfer: onTransferPress,
    history: onHistoryPress,
  };

  return (
    <View style={styles.quickActions}>
      {actions.map((action) => {
        const primary = action.key === "transfer";

        return (
          <Pressable
            key={action.key}
            accessibilityRole="button"
            accessibilityLabel={tr(action.accessibilityKey)}
            onPress={handlers[action.key]}
            style={({ pressed }) => [
              styles.quickAction,
              primary
                ? styles.quickActionPrimary
                : { borderColor: theme.border, backgroundColor: theme.surface },
              pressed && styles.quickActionPressed,
            ]}
          >
            <Ionicons
              name={action.icon}
              size={17}
              color={primary ? walletsPalette.onPrimary : walletsPalette.primary}
            />
            <ThemedText
              numberOfLines={2}
              style={[
                styles.quickActionText,
                primary
                  ? styles.quickActionTextPrimary
                  : { color: theme.text },
              ]}
            >
              {tr(action.labelKey)}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
