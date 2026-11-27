import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import {
  fabActionMenuPalette,
  fabActionMenuStyles as styles,
} from "./fab-action-menu.styles";

export type FabActionMenuIconName = ComponentProps<typeof Ionicons>["name"];

export interface FabActionMenuAction {
  key: string;
  /** Already translated action label. */
  label: string;
  icon: FabActionMenuIconName;
  /** Already translated; rendered under the label only when present. */
  hint?: string;
  disabled?: boolean;
  onPress: () => void;
}

export interface FabActionMenuProps {
  visible: boolean;
  /** Already translated menu header. */
  title: string;
  onClose: () => void;
  actions: readonly FabActionMenuAction[];
}

/**
 * Bottom action menu opened by a FAB. It owns the overlay, the theme and the
 * accessibility contract; every action arrives already translated, so the
 * component knows nothing about the feature that renders it.
 */
export function FabActionMenu({
  visible,
  title,
  onClose,
  actions,
}: FabActionMenuProps) {
  const theme = useFormTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      presentationStyle="overFullScreen"
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.overlay,
          { paddingBottom: Math.max(insets.bottom, 8) + 8 },
        ]}
      >
        <Pressable
          accessible={false}
          onPress={onClose}
          style={[
            styles.backdrop,
            { backgroundColor: fabActionMenuPalette.backdrop },
          ]}
        />

        <View
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <ThemedText
            type="defaultSemiBold"
            accessibilityRole="header"
            style={styles.title}
          >
            {title}
          </ThemedText>

          {actions.map((action) => {
            const disabled = action.disabled === true;

            return (
              <Pressable
                key={action.key}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                accessibilityHint={action.hint}
                accessibilityState={{ disabled }}
                disabled={disabled}
                onPress={() => {
                  onClose();
                  action.onPress();
                }}
                style={({ pressed }) => [
                  styles.action,
                  { borderColor: theme.border },
                  disabled && styles.actionDisabled,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name={action.icon}
                  size={20}
                  color={disabled ? theme.muted : theme.primary}
                  accessible={false}
                />
                <View style={styles.actionBody}>
                  <ThemedText type="defaultSemiBold">{action.label}</ThemedText>
                  {action.hint ? (
                    <ThemedText style={[styles.hint, { color: theme.muted }]}>
                      {action.hint}
                    </ThemedText>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}
