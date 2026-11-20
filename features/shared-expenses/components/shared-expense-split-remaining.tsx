import { useEffect } from "react";
import { AccessibilityInfo, Platform } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { CurrencyCode } from "@/shared/constants/currencies";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { sharedExpensesStyles as styles } from "../styles/shared-expenses.styles";
import {
  formatRemainingCents,
  getFixedSplitRemaining,
} from "../utils/expense-remaining";

export interface SharedExpenseSplitRemainingProps {
  amountText: string;
  values: Record<string, string>;
  currency: CurrencyCode;
}

/**
 * Informative line under the fixed-split inputs. It never blocks the save: the
 * schema keeps reporting FIXED_SUM_MISMATCH/INVALID_FIXED_AMOUNT. Without a
 * valid total there is nothing to compare against, so the line stays hidden.
 */
export function SharedExpenseSplitRemaining({
  amountText,
  values,
  currency,
}: SharedExpenseSplitRemainingProps) {
  const theme = useFormTheme();
  const { locale } = useAppLocale();
  const { t } = useScopedTranslation("sharedExpenses");
  const remaining = getFixedSplitRemaining(amountText, Object.values(values));

  const total = formatRemainingCents(remaining.totalCents, currency, locale);
  const missing = formatRemainingCents(
    remaining.missingCents,
    currency,
    locale,
  );
  const excess = formatRemainingCents(remaining.excessCents, currency, locale);

  const text =
    remaining.totalCents === 0
      ? null
      : remaining.state === "over"
        ? t("form.splitRemainingOver", { total, excess })
        : remaining.state === "partial"
          ? t("form.splitRemainingPartial", { total, missing })
          : t("form.splitRemainingComplete", { total });

  // `accessibilityLiveRegion` only reaches Android; iOS needs an explicit polite
  // announcement. Neither path moves focus out of the input being typed.
  useEffect(() => {
    if (!text || Platform.OS !== "ios") return;

    AccessibilityInfo.announceForAccessibility(text);
  }, [text]);

  if (!text) return null;

  return (
    <ThemedText
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      style={[
        styles.helper,
        { color: remaining.state === "over" ? theme.danger : theme.muted },
      ]}
    >
      {text}
    </ThemedText>
  );
}
