import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import {
  transferHistoryPalette,
  transferHistoryStyles as styles,
} from "../styles/transfer-history.styles";
import { getTransferHistoryEmptyCopy } from "../utils/transfer-history";

export function TransferHistoryEmptyState() {
  const copy = getTransferHistoryEmptyCopy();

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name="swap-horizontal"
          size={36}
          color={transferHistoryPalette.primary}
        />
      </View>
      <ThemedText type="subtitle" style={styles.emptyTitle}>
        {copy.title}
      </ThemedText>
      <ThemedText style={styles.centeredText}>{copy.message}</ThemedText>
    </View>
  );
}
