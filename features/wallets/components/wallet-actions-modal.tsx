import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { walletManagementStyles as styles } from "../styles/wallet-management.styles";
import { Wallet } from "../types/wallet.types";
import { formatMoney } from "../utils/money";
import { isWalletArchived } from "../utils/wallet-status";

export interface WalletActionsModalProps {
  wallet: Wallet | null;
  onEdit: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function WalletActionsModal({
  wallet,
  onEdit,
  onToggleArchive,
  onDelete,
  onClose,
}: WalletActionsModalProps) {
  const theme = useFormTheme();

  if (!wallet) return null;

  const archived = isWalletArchived(wallet);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel="Cerrar acciones de la cartera"
          onPress={onClose}
        />
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.background, borderColor: theme.border },
          ]}
        >
          <ThemedText type="title" style={styles.sheetTitle}>
            {wallet.name}
          </ThemedText>
          <ThemedText style={[styles.sheetSubtitle, { color: theme.muted }]}>
            {archived ? "Cartera archivada" : "Cartera activa"} ·{" "}
            {formatMoney(wallet.balance, wallet.currency)}
          </ThemedText>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Editar cartera"
            onPress={onEdit}
            style={[styles.actionButton, { borderColor: theme.border }]}
          >
            <Ionicons name="pencil-outline" size={20} color={theme.primary} />
            <ThemedText style={styles.actionText}>Editar cartera</ThemedText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              archived ? "Restaurar cartera" : "Archivar cartera"
            }
            onPress={onToggleArchive}
            style={[styles.actionButton, { borderColor: theme.border }]}
          >
            <Ionicons
              name={archived ? "arrow-undo-outline" : "archive-outline"}
              size={20}
              color={theme.primary}
            />
            <ThemedText style={styles.actionText}>
              {archived ? "Restaurar cartera" : "Archivar cartera"}
            </ThemedText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Eliminar cartera"
            onPress={onDelete}
            style={[
              styles.actionButton,
              { borderColor: theme.danger, backgroundColor: theme.dangerSurface },
            ]}
          >
            <Ionicons name="trash-outline" size={20} color={theme.danger} />
            <ThemedText style={[styles.actionText, { color: theme.dangerText }]}>
              Eliminar cartera
            </ThemedText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancelar acciones"
            onPress={onClose}
            style={styles.cancelButton}
          >
            <ThemedText type="defaultSemiBold" style={{ color: theme.muted }}>
              Cancelar
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
