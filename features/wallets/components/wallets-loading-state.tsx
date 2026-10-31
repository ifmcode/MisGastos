import { ActivityIndicator, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import { walletsPalette, walletsStyles } from "../styles/wallets.styles";

export function WalletsLoadingState() {
  return (
    <View style={walletsStyles.centered}>
      <ActivityIndicator size="large" color={walletsPalette.primary} />
      <ThemedText style={walletsStyles.centeredText}>
        Cargando carteras…
      </ThemedText>
    </View>
  );
}
