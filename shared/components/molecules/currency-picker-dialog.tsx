import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { CurrencyCode } from "@/shared/constants/currencies";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import {
  CurrencyChipSelector,
  type CurrencyOption,
} from "./currency-chip-selector";
import { currencyPickerDialogStyles as styles } from "./currency-field.styles";

export interface CurrencyPickerDialogProps {
  visible: boolean;
  /** Already translated copy; the molecule owns no translation namespace. */
  title: string;
  closeAccessibilityLabel: string;
  groupAccessibilityLabel: string;
  value: CurrencyCode;
  getCurrencyAccessibilityLabel: (currency: CurrencyOption) => string;
  onChange: (currency: CurrencyCode) => void;
  onClose: () => void;
}

/**
 * Currency popup of the compact field. The chip selector stays the single
 * currency list, so there is no second model to keep in sync.
 */
export function CurrencyPickerDialog({
  visible,
  title,
  closeAccessibilityLabel,
  groupAccessibilityLabel,
  value,
  getCurrencyAccessibilityLabel,
  onChange,
  onClose,
}: CurrencyPickerDialogProps) {
  const theme = useFormTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          accessible={false}
          onPress={onClose}
          style={styles.backdrop}
        />
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.header}>
            <ThemedText
              type="defaultSemiBold"
              accessibilityRole="header"
              style={styles.title}
            >
              {title}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={closeAccessibilityLabel}
              onPress={onClose}
              hitSlop={8}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={theme.muted} />
            </Pressable>
          </View>

          <View
            style={styles.content}
            accessibilityRole="radiogroup"
            accessibilityLabel={groupAccessibilityLabel}
          >
            <CurrencyChipSelector
              value={value}
              getAccessibilityLabel={getCurrencyAccessibilityLabel}
              onChange={onChange}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
