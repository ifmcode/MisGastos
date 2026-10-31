import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import { walletsPalette, walletsStyles } from "../styles/wallets.styles";

export interface WalletsHeaderProps {
  showAddButton: boolean;
  onAddPress: () => void;
}

export function WalletsHeader({
  showAddButton,
  onAddPress,
}: WalletsHeaderProps) {
  return (
    <View style={walletsStyles.header}>
      <View style={walletsStyles.headerText}>
        <ThemedText type="title" style={walletsStyles.title}>
          Carteras
        </ThemedText>
        <ThemedText style={walletsStyles.subtitle}>
          Consulta y organiza tus cuentas.
        </ThemedText>
      </View>

      {showAddButton ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Añadir cartera"
          onPress={onAddPress}
          style={walletsStyles.headerButton}
        >
          <Ionicons name="add" size={20} color={walletsPalette.onPrimary} />
          <ThemedText style={walletsStyles.headerButtonText}>Nueva</ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}
