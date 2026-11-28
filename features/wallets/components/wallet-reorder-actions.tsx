import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { walletsStyles as styles } from "../styles/wallets.styles";

export interface WalletReorderActionsProps {
  walletName: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  disabled: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

/** Explicit up/down controls: the wallet reorder has no drag and drop. */
export function WalletReorderActions({
  walletName,
  canMoveUp,
  canMoveDown,
  disabled,
  onMoveUp,
  onMoveDown,
}: WalletReorderActionsProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("wallets");

  return (
    <View style={styles.reorderActions}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("reorder.moveUp", { name: walletName })}
        accessibilityState={{ disabled: disabled || !canMoveUp }}
        disabled={disabled || !canMoveUp}
        onPress={onMoveUp}
        hitSlop={6}
        style={[
          styles.reorderButton,
          (disabled || !canMoveUp) && styles.reorderButtonDisabled,
        ]}
      >
        <Ionicons
          name="chevron-up"
          size={18}
          color={theme.text}
          accessible={false}
        />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("reorder.moveDown", { name: walletName })}
        accessibilityState={{ disabled: disabled || !canMoveDown }}
        disabled={disabled || !canMoveDown}
        onPress={onMoveDown}
        hitSlop={6}
        style={[
          styles.reorderButton,
          (disabled || !canMoveDown) && styles.reorderButtonDisabled,
        ]}
      >
        <Ionicons
          name="chevron-down"
          size={18}
          color={theme.text}
          accessible={false}
        />
      </Pressable>
    </View>
  );
}
