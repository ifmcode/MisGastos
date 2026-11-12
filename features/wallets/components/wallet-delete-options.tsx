import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { asTranslate } from "@/shared/i18n/translate";

import { walletManagementStyles as styles } from "../styles/wallet-management.styles";
import { Wallet, WalletDeleteMode } from "../types/wallet.types";

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
  titleKey: string;
  hintKey: string;
}> = [
  {
    mode: "keep",
    titleKey: "delete.keepTitle",
    hintKey: "delete.keepHint",
  },
  {
    mode: "reassign",
    titleKey: "delete.reassignTitle",
    hintKey: "delete.reassignHint",
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
  const { t } = useTranslation("wallets");
  const tr = asTranslate(t);
  const locale = useAppLocale();
  const canReassign = targets.length > 0;

  return (
    <>
      {MODE_OPTIONS.map((option) => {
        const selected = mode === option.mode;
        const optionDisabled = option.mode === "reassign" && !canReassign;
        const title = tr(option.titleKey);
        const hint = tr(option.hintKey);

        return (
          <View key={option.mode} style={styles.optionGroup}>
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{
                checked: selected,
                disabled: optionDisabled,
              }}
              accessibilityLabel={title}
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
                <ThemedText style={styles.optionTitle}>{title}</ThemedText>
                <ThemedText style={[styles.optionHint, { color: theme.muted }]}>
                  {option.mode === "keep"
                    ? t("delete.keepHintNamed", { name: deletedName, hint })
                    : hint}
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
                        accessibilityLabel={t("delete.reassignAccessibility", {
                          name: target.name,
                        })}
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
                          {locale.formatCurrency(target.balance, target.currency)}
                        </ThemedText>
                      </Pressable>
                    );
                  })
                ) : (
                  <ThemedText style={[styles.optionHint, { color: theme.muted }]}>
                    {t("delete.noTargets")}
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
