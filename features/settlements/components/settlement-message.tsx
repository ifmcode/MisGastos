import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { centsToAmount } from "@/features/friends/utils/friend-balance";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { settlementsStyles as styles } from "../styles/settlements.styles";
import type { Settlement } from "../types/settlement.types";

export interface SettlementMessageProps {
  settlement: Settlement;
  viewerUid: string;
  friendName: string;
  /** True when the settlement left the pair at zero in every currency. */
  pairSettled: boolean;
  onOpen: (settlement: Settlement) => void;
}

/**
 * Latest active settlement shown above the pair expenses. It only navigates:
 * the edit and delete actions live in the settlement detail.
 */
export function SettlementMessage({
  settlement,
  viewerUid,
  friendName,
  pairSettled,
  onOpen,
}: SettlementMessageProps) {
  const theme = useFormTheme();
  const locale = useAppLocale();
  const { t } = useScopedTranslation("settlements");
  const amount = locale.formatCurrency(
    centsToAmount(settlement.amountCents),
    settlement.currency,
  );
  const sentence =
    settlement.fromUserId === viewerUid
      ? t("message.youPaid", { amount, name: friendName })
      : t("message.youReceived", { amount, name: friendName });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("message.openAccessibility", {
        amount,
        name: friendName,
      })}
      accessibilityHint={t("message.openHint")}
      onPress={() => onOpen(settlement)}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <View
        style={[
          styles.messageCard,
          { borderColor: theme.border, backgroundColor: theme.surface },
        ]}
      >
        <View
          style={[styles.messageIcon, { backgroundColor: theme.primarySoft }]}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={20}
            color={theme.success}
            accessible={false}
          />
        </View>

        <View style={styles.messageBody}>
          <ThemedText style={styles.messageTitle} numberOfLines={1}>
            {t("message.title")}
          </ThemedText>
          <ThemedText
            style={[styles.messageMeta, { color: theme.muted }]}
            numberOfLines={2}
          >
            {sentence}
          </ThemedText>
        </View>

        <View style={styles.messageAmountColumn}>
          <ThemedText style={styles.messageAmount}>{amount}</ThemedText>
          <ThemedText
            style={[
              styles.messageBadge,
              { color: pairSettled ? theme.success : theme.muted },
            ]}
          >
            {pairSettled ? t("message.full") : t("message.partial")}
          </ThemedText>
        </View>

        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.muted}
          style={styles.chevron}
          accessible={false}
        />
      </View>
    </Pressable>
  );
}
