import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("wallets");

  return (
    <View style={walletsStyles.header}>
      <View style={walletsStyles.headerText}>
        <ThemedText type="title" style={walletsStyles.title}>
          {t("title")}
        </ThemedText>
        <ThemedText style={walletsStyles.subtitle}>
          {t("subtitle")}
        </ThemedText>
      </View>

      {showAddButton ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("add")}
          onPress={onAddPress}
          style={walletsStyles.headerButton}
        >
          <Ionicons name="add" size={20} color={walletsPalette.onPrimary} />
          <ThemedText style={walletsStyles.headerButtonText}>
            {t("new")}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}
