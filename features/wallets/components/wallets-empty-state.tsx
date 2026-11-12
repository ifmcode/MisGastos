import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import { walletsPalette, walletsStyles } from "../styles/wallets.styles";

export interface WalletsEmptyStateProps {
  onCreate: () => void;
}

export function WalletsEmptyState({ onCreate }: WalletsEmptyStateProps) {
  const { t } = useTranslation("wallets");

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
        {t("emptyTitle")}
      </ThemedText>
      <ThemedText style={walletsStyles.centeredText}>
        {t("emptyMessage")}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("createFirst")}
        onPress={onCreate}
        style={walletsStyles.createButton}
      >
        <Ionicons name="add" size={20} color={walletsPalette.onPrimary} />
        <ThemedText style={walletsStyles.createButtonText}>
          {t("create")}
        </ThemedText>
      </Pressable>
    </View>
  );
}
