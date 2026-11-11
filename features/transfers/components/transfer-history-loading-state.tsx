import { ActivityIndicator, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import {
  transferHistoryPalette,
  transferHistoryStyles as styles,
} from "../styles/transfer-history.styles";

export function TransferHistoryLoadingState() {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={transferHistoryPalette.primary} />
      <ThemedText style={styles.centeredText}>
        Cargando transferencias…
      </ThemedText>
    </View>
  );
}
