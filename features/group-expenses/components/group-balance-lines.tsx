import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { groupBalancesStyles as styles } from "../styles/group-balances.styles";
import type { ViewerBalanceLine } from "../utils/viewer-balance-lines";

export interface GroupBalanceLinesProps {
  /** Already formatted lines of one viewer, one per currency. */
  lines: readonly ViewerBalanceLine[];
  /** Copy shown when the viewer has no pending balance. */
  settledLabel: string;
  /** `meta` is the larger header line; `compact` matches list rows. */
  variant?: "meta" | "compact";
}

/** One line per currency with the viewer's net; "En paz" when settled. */
export function GroupBalanceLines({
  lines,
  settledLabel,
  variant = "compact",
}: GroupBalanceLinesProps) {
  const theme = useFormTheme();
  const lineStyle =
    variant === "meta" ? styles.balanceLineMeta : styles.balanceLine;

  return (
    <View style={styles.balanceLines}>
      {lines.length === 0 ? (
        <ThemedText style={[lineStyle, { color: theme.success }]}>
          {settledLabel}
        </ThemedText>
      ) : (
        lines.map((line) => (
          <ThemedText
            key={line.currency}
            style={[
              lineStyle,
              {
                color:
                  line.direction === "owed-to-viewer"
                    ? theme.success
                    : theme.danger,
              },
            ]}
          >
            {line.text}
          </ThemedText>
        ))
      )}
    </View>
  );
}
