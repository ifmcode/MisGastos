import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { recordCardStyles as styles } from "./record-card.styles";

export interface RecordCardProps {
  /** Feature-resolved accessibility summary and hint. */
  accessibilityLabel: string;
  accessibilityHint: string;
  onPress: () => void;
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  meta: string;
  amount: string;
  /** Optional short pill next to the title (for example "Compartido"). */
  badge?: string;
  /** Optional amount tone (for example success/danger on movements). */
  amountColor?: string;
  /** Optional second amount line (for example the currency code). */
  secondaryAmount?: string;
  affordanceIconSize?: number;
}

/** Pressable row shared by movements and transfers. */
export function RecordCard({
  accessibilityLabel,
  accessibilityHint,
  onPress,
  icon,
  title,
  meta,
  amount,
  badge,
  amountColor,
  secondaryAmount,
  affordanceIconSize = 16,
}: RecordCardProps) {
  const theme = useFormTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <ThemedView
        style={[
          styles.card,
          { borderColor: theme.border, backgroundColor: theme.surface },
        ]}
      >
        <View
          style={[styles.iconWrapper, { backgroundColor: theme.primarySoft }]}
        >
          <Ionicons name={icon} size={20} color={theme.primary} />
        </View>

        <View style={styles.details}>
          <View style={styles.titleRow}>
            <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.title}>
              {title}
            </ThemedText>
            {badge ? (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: theme.primarySoft },
                ]}
              >
                <ThemedText
                  style={[styles.badgeText, { color: theme.primary }]}
                  numberOfLines={1}
                >
                  {badge}
                </ThemedText>
              </View>
            ) : null}
          </View>
          <ThemedText style={styles.meta} numberOfLines={1}>
            {meta}
          </ThemedText>
        </View>

        <View style={styles.amountColumn}>
          <ThemedText
            type="defaultSemiBold"
            style={[styles.amount, amountColor ? { color: amountColor } : null]}
            numberOfLines={1}
          >
            {amount}
          </ThemedText>
          {secondaryAmount ? (
            <ThemedText style={styles.secondaryAmount}>
              {secondaryAmount}
            </ThemedText>
          ) : null}
        </View>

        <View
          style={[styles.affordance, { backgroundColor: theme.primarySoft }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Ionicons
            name="chevron-forward"
            size={affordanceIconSize}
            color={theme.primary}
          />
        </View>
      </ThemedView>
    </Pressable>
  );
}
