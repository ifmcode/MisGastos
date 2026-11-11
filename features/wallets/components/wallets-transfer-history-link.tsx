import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { walletsPalette, walletsStyles as styles } from "../styles/wallets.styles";

export interface WalletsTransferHistoryLinkProps {
  onPress: () => void;
}

export function WalletsTransferHistoryLink({
  onPress,
}: WalletsTransferHistoryLinkProps) {
  const theme = useFormTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Ver historial de transferencias"
      onPress={onPress}
      style={({ pressed }) => [
        styles.transferHistoryLink,
        { borderColor: theme.border, backgroundColor: theme.surface },
        pressed && styles.transferHistoryLinkPressed,
      ]}
    >
      <View style={styles.transferHistoryLinkIcon}>
        <Ionicons
          name="swap-horizontal"
          size={20}
          color={walletsPalette.primary}
        />
      </View>

      <View style={styles.transferHistoryLinkText}>
        <ThemedText
          type="defaultSemiBold"
          style={styles.transferHistoryLinkTitle}
        >
          Historial de transferencias
        </ThemedText>
        <ThemedText style={styles.transferHistoryLinkSubtitle}>
          Consulta todos tus traspasos entre carteras.
        </ThemedText>
      </View>

      <Ionicons name="chevron-forward" size={18} color={theme.muted} />
    </Pressable>
  );
}
