import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { LocalConflictResolution } from "@/shared/lib/local-db/local-db.types";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { syncStyles as styles } from "../styles/sync.styles";

export interface SyncConflictActionsProps {
  /** Decisions the conflict policy allows for this kind. */
  options: readonly LocalConflictResolution[];
  disabled: boolean;
  onResolve: (choice: LocalConflictResolution) => void;
}

/**
 * Decision buttons of the conflict dialog, stacked so the long labels never
 * truncate. "Keep mine" is the primary action when it is offered; a conflict
 * that can only be discarded shows "Keep remote" as the primary one.
 */
export function SyncConflictActions({
  options,
  disabled,
  onResolve,
}: SyncConflictActionsProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("sync");
  const keepMine = options.includes("keep-mine");
  const keepRemote = options.includes("keep-remote");

  const remoteIsPrimary = !keepMine;

  return (
    <View style={styles.dialogActions}>
      {keepRemote ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("conflict.keepRemote")}
          accessibilityHint={t("conflict.keepRemoteHint")}
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={() => onResolve("keep-remote")}
          style={({ pressed }) => [
            styles.actionButton,
            remoteIsPrimary
              ? { borderColor: theme.primary, backgroundColor: theme.primary }
              : { borderColor: theme.border, backgroundColor: theme.surface },
            disabled && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <ThemedText
            style={[
              remoteIsPrimary
                ? styles.actionPrimaryText
                : styles.actionSecondaryText,
              { color: remoteIsPrimary ? theme.onPrimary : theme.text },
            ]}
          >
            {t("conflict.keepRemote")}
          </ThemedText>
        </Pressable>
      ) : null}

      {keepMine ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("conflict.keepMine")}
          accessibilityHint={t("conflict.keepMineHint")}
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={() => onResolve("keep-mine")}
          style={({ pressed }) => [
            styles.actionButton,
            { borderColor: theme.primary, backgroundColor: theme.primary },
            disabled && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <ThemedText
            style={[styles.actionPrimaryText, { color: theme.onPrimary }]}
          >
            {t("conflict.keepMine")}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}
