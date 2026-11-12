import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { walletPickerStyles as styles } from "../styles/wallet-picker.styles";
import { Wallet } from "../types/wallet.types";
import { getWalletChips } from "../utils/wallet-chips";

export interface WalletChipSelectorProps {
  wallets: readonly Wallet[];
  selectedId: string;
  disabled: boolean;
  /** Screen-reader context: "Cartera", "Origen" or "Destino". */
  accessibilityPrefix: string;
  onSelect: (walletId: string) => void;
  onOpenPicker: () => void;
}

/**
 * Compact wallet picker: up to three chips plus a `+` chip that opens the
 * complete wallet popup. The selected wallet always stays visible.
 */
export function WalletChipSelector({
  wallets,
  selectedId,
  disabled,
  accessibilityPrefix,
  onSelect,
  onOpenPicker,
}: WalletChipSelectorProps) {
  const theme = useFormTheme();
  const { visible } = getWalletChips(wallets, selectedId);

  return (
    <View style={styles.chipRow}>
      {visible.map((wallet) => {
        const selected = selectedId === wallet.id;

        return (
          <Pressable
            key={wallet.id}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${accessibilityPrefix} ${wallet.name}`}
            onPress={() => onSelect(wallet.id)}
            disabled={disabled}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? theme.primarySoft : theme.surface,
                borderColor: selected ? theme.primary : theme.border,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.chipText,
                { color: selected ? theme.primary : theme.text },
              ]}
              numberOfLines={1}
            >
              {wallet.name}
            </ThemedText>
          </Pressable>
        );
      })}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Seleccionar cartera"
        accessibilityHint="Abre la lista completa de carteras"
        onPress={onOpenPicker}
        disabled={disabled}
        style={[
          styles.chip,
          styles.chipAdd,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Ionicons name="add" size={20} color={theme.primary} />
      </Pressable>
    </View>
  );
}
