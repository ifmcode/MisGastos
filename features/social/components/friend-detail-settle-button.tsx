import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { friendDetailStyles as styles } from "../styles/friend-detail.styles";

export interface FriendDetailSettleButtonProps {
  /** Friend display name used by the accessibility label. */
  name: string;
  onPress: () => void;
}

/** Entry point to `/social/settlements/new` for the pair debt. */
export function FriendDetailSettleButton({
  name,
  onPress,
}: FriendDetailSettleButtonProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("settlements");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("friendDetail.settleAccessibility", { name })}
      accessibilityHint={t("friendDetail.settleHint")}
      onPress={onPress}
      style={({ pressed }) => [
        styles.settleButton,
        { backgroundColor: theme.primary },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name="swap-horizontal-outline"
        size={18}
        color={theme.onPrimary}
        accessible={false}
      />
      <ThemedText style={[styles.settleButtonText, { color: theme.onPrimary }]}>
        {t("friendDetail.settle")}
      </ThemedText>
    </Pressable>
  );
}
