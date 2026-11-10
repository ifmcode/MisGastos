import { Pressable, ScrollView, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { walletManagementStyles as styles } from "../styles/wallet-management.styles";
import { Wallet, WalletDeleteMode } from "../types/wallet.types";
import { formatMoney } from "../utils/money";

export interface WalletDeleteOptionsProps {
  targets: readonly Wallet[];
  mode: WalletDeleteMode;
  targetWalletId: string | null;
  deletedName: string;
  submitting: boolean;
  onModeChange: (mode: WalletDeleteMode) => void;
  onTargetChange: (walletId: string) => void;
}

const MODE_OPTIONS: ReadonlyArray<{
  mode: WalletDeleteMode;
  title: string;
  hint: string;
}> = [
  {
    mode: "keep",
    title: "Conservar los movimientos",
    hint: "Se mantendrán en el historial bajo la cartera eliminada sin afectar a ninguna otra cartera.",
  },
  {
    mode: "reassign",
    title: "Mover a otra cartera",
    hint: "Los movimientos pasan a otra cartera activa con la misma moneda.",
  },
];

/** Movement strategy and target selection for a permanent wallet deletion. */
export function WalletDeleteOptions({
  targets,
  mode,
  targetWalletId,
  deletedName,
  submitting,
  onModeChange,
  onTargetChange,
}: WalletDeleteOptionsProps) {
  const theme = useFormTheme();
  const canReassign = targets.length > 0;

  return (
    <>
      {MODE_OPTIONS.map((option) => {
        const selected = mode === option.mode;
        const optionDisabled = option.mode === "reassign" && !canReassign;

        return (
          <View key={option.mode} style={styles.optionGroup}>
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{
                checked: selected,
                disabled: optionDisabled,
              }}
              accessibilityLabel={option.title}
              disabled={optionDisabled || submitting}
              onPress={() => onModeChange(option.mode)}
              style={[
                styles.option,
                { borderColor: selected ? theme.primary : theme.border },
                selected && { backgroundColor: theme.primarySoft },
                (optionDisabled || submitting) && styles.disabled,
              ]}
            >
              <View
                style={[
                  styles.radio,
                  { borderColor: selected ? theme.primary : theme.border },
                ]}
              >
                {selected ? <View style={styles.radioDot} /> : null}
              </View>
              <View style={styles.optionText}>
                <ThemedText style={styles.optionTitle}>
                  {option.title}
                </ThemedText>
                <ThemedText
                  style={[styles.optionHint, { color: theme.muted }]}
                >
                  {option.mode === "keep"
                    ? `Quedarán como «${deletedName}». ${option.hint}`
                    : option.hint}
                </ThemedText>
              </View>
            </Pressable>

            {option.mode === "reassign" && selected ? (
              <ScrollView
                style={styles.targetScroll}
                contentContainerStyle={styles.targetList}
                showsVerticalScrollIndicator={false}
              >
                {canReassign ? (
                  targets.map((target) => {
                    const targetSelected = target.id === targetWalletId;

                    return (
                      <Pressable
                        key={target.id}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: targetSelected }}
                        accessibilityLabel={`Mover movimientos a ${target.name}`}
                        disabled={submitting}
                        onPress={() => onTargetChange(target.id)}
                        style={[
                          styles.targetChip,
                          {
                            borderColor: targetSelected
                              ? theme.primary
                              : theme.border,
                          },
                          targetSelected && {
                            backgroundColor: theme.primarySoft,
                          },
                        ]}
                      >
                        <ThemedText style={styles.targetText}>
                          {target.name} ·{" "}
                          {formatMoney(target.balance, target.currency)}
                        </ThemedText>
                      </Pressable>
                    );
                  })
                ) : (
                  <ThemedText
                    style={[styles.optionHint, { color: theme.muted }]}
                  >
                    No hay otra cartera activa con la misma moneda.
                  </ThemedText>
                )}
              </ScrollView>
            ) : null}
          </View>
        );
      })}
    </>
  );
}
