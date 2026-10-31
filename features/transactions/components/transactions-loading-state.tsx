import { ActivityIndicator, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import {
  transactionsPalette,
  transactionsStyles as styles,
} from "../styles/transactions.styles";

export function TransactionsLoadingState() {
  return (
    <View style={styles.centered}>
      <ActivityIndicator
        size="large"
        color={transactionsPalette.primary}
      />
      <ThemedText style={styles.centeredText}>
        Cargando movimientos…
      </ThemedText>
    </View>
  );
}
