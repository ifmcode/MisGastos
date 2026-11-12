import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { walletPickerStyles as styles } from "../styles/wallet-picker.styles";
import { Wallet } from "../types/wallet.types";
import { WalletPickerOption } from "./wallet-picker-option";

export interface WalletPickerDialogProps {
  visible: boolean;
  wallets: readonly Wallet[];
  selectedId: string;
  disabled: boolean;
  /** Screen-reader context: "Cartera", "Origen" or "Destino". */
  accessibilityPrefix: string;
  onSelect: (walletId: string) => void;
  onClose: () => void;
}

/**
 * Read-only wallet popup opened from the compact selector. It lists every
 * wallet it receives exactly once and never offers a creation action.
 */
export function WalletPickerDialog({
  visible,
  wallets,
  selectedId,
  disabled,
  accessibilityPrefix,
  onSelect,
  onClose,
}: WalletPickerDialogProps) {
  const theme = useFormTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          accessible={false}
          onPress={onClose}
          style={styles.backdrop}
        />
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.header}>
            <ThemedText
              type="defaultSemiBold"
              accessibilityRole="header"
              style={styles.title}
            >
              Seleccionar cartera
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar selector de cartera"
              onPress={onClose}
              hitSlop={8}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={theme.muted} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {wallets.length === 0 ? (
              <ThemedText style={[styles.helper, { color: theme.muted }]}>
                No hay carteras disponibles.
              </ThemedText>
            ) : null}

            {wallets.map((wallet) => (
              <WalletPickerOption
                key={wallet.id}
                wallet={wallet}
                selected={selectedId === wallet.id}
                disabled={disabled}
                accessibilityPrefix={accessibilityPrefix}
                onSelect={onSelect}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
