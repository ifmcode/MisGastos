import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transferHistoryStyles as styles } from "../styles/transfer-history.styles";

export interface TransferHistoryHeaderProps {
  onBack: () => void;
}

export function TransferHistoryHeader({ onBack }: TransferHistoryHeaderProps) {
  const theme = useFormTheme();

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver"
        onPress={onBack}
        style={styles.backButton}
      >
        <Ionicons name="chevron-back" size={24} color={theme.text} />
      </Pressable>

      <View style={styles.headerText}>
        <ThemedText type="title" style={styles.title} numberOfLines={2}>
          Historial de transferencias
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Todos tus traspasos entre carteras.
        </ThemedText>
      </View>
    </View>
  );
}
