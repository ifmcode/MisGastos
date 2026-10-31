import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transferFormStyles as styles } from "../styles/transfer-form.styles";

export interface TransferFormErrorBannerProps {
  message: string;
}

export function TransferFormErrorBanner({
  message,
}: TransferFormErrorBannerProps) {
  const theme = useFormTheme();

  return (
    <View style={styles.errorBanner}>
      <Ionicons name="alert-circle" size={20} color={theme.danger} />
      <ThemedText style={styles.errorBannerText}>{message}</ThemedText>
    </View>
  );
}
