import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { walletFormStyles as styles } from "../styles/wallet-form.styles";

export interface WalletFormHeaderProps {
  disabled: boolean;
  onClose: () => void;
}

export function WalletFormHeader({
  disabled,
  onClose,
}: WalletFormHeaderProps) {
  const theme = useFormTheme();

  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <ThemedText type="title" style={styles.title}>
          Nueva cartera
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.muted }]}>
          Configura dónde guardarás tu dinero.
        </ThemedText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar formulario"
        hitSlop={10}
        onPress={onClose}
        disabled={disabled}
        style={styles.closeButton}
      >
        <Ionicons name="close" size={24} color={theme.muted} />
      </Pressable>
    </View>
  );
}
