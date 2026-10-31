import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

import {
  transactionsPalette,
  transactionsStyles as styles,
} from "../styles/transactions.styles";

export interface TransactionsFabProps {
  bottom: number;
  onPress: () => void;
}

export function TransactionsFab({ bottom, onPress }: TransactionsFabProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Añadir movimiento"
      onPress={onPress}
      style={[styles.fab, { bottom }]}
    >
      <Ionicons name="add" size={30} color={transactionsPalette.onPrimary} />
    </Pressable>
  );
}
