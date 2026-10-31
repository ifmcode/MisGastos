import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import { walletsPalette, walletsStyles } from "../styles/wallets.styles";

export interface WalletsEmptyStateProps {
  onCreate: () => void;
}

export function WalletsEmptyState({ onCreate }: WalletsEmptyStateProps) {
  return (
    <View style={walletsStyles.emptyState}>
      <View style={walletsStyles.emptyIcon}>
        <Ionicons
          name="wallet-outline"
          size={36}
          color={walletsPalette.primary}
        />
      </View>
      <ThemedText type="subtitle" style={walletsStyles.emptyTitle}>
        Aún no tienes carteras
      </ThemedText>
      <ThemedText style={walletsStyles.centeredText}>
        Crea tu primera cartera para empezar a organizar tus gastos e ingresos.
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Crear primera cartera"
        onPress={onCreate}
        style={walletsStyles.createButton}
      >
        <Ionicons name="add" size={20} color={walletsPalette.onPrimary} />
        <ThemedText style={walletsStyles.createButtonText}>
          Crear cartera
        </ThemedText>
      </Pressable>
    </View>
  );
}
