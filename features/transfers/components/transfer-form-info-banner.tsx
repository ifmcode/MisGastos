import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transferFormStyles as styles } from "../styles/transfer-form.styles";

export interface TransferFormInfoBannerProps {
  message: string;
  showIcon?: boolean;
}

export function TransferFormInfoBanner({
  message,
  showIcon = false,
}: TransferFormInfoBannerProps) {
  const theme = useFormTheme();

  return (
    <View
      style={[
        styles.infoBanner,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      {showIcon ? (
        <Ionicons
          name="information-circle-outline"
          size={20}
          color={theme.primary}
        />
      ) : null}
      <ThemedText style={[styles.infoText, { color: theme.muted }]}>
        {message}
      </ThemedText>
    </View>
  );
}
