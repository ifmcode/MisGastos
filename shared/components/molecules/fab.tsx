import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { fabStyles as styles } from "./fab.styles";

export interface FabProps {
  /** Already translated accessibility label. */
  accessibilityLabel: string;
  /** Already translated hint that explains what the FAB opens. */
  accessibilityHint?: string;
  bottom: number;
  onPress: () => void;
}

/** Primary floating action button shared by the list screens. */
export function Fab({
  accessibilityLabel,
  accessibilityHint,
  bottom,
  onPress,
}: FabProps) {
  const theme = useFormTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={[
        styles.fab,
        { bottom, backgroundColor: theme.primary },
      ]}
    >
      <Ionicons name="add" size={30} color={theme.onPrimary} />
    </Pressable>
  );
}
