import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import type { LocalConflictResolution } from "@/shared/lib/local-db/local-db.types";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { syncStyles as styles } from "../styles/sync.styles";
import type { SyncConflictView } from "../utils/sync-conflict-view";
import { SyncConflictActions } from "./sync-conflict-actions";
import { SyncConflictValues } from "./sync-conflict-values";

export interface SyncConflictDialogProps {
  visible: boolean;
  view: SyncConflictView | null;
  resolving: boolean;
  errorMessage: string | null;
  onResolve: (choice: LocalConflictResolution) => void;
  onClose: () => void;
}

/**
 * Bottom sheet that contrasts both snapshots of one conflict and asks for an
 * explicit decision. The backdrop, the close button and the escape gesture are
 * blocked while the resolution is being written, so a double decision cannot
 * race the local transaction.
 */
export function SyncConflictDialog({
  visible,
  view,
  resolving,
  errorMessage,
  onResolve,
  onClose,
}: SyncConflictDialogProps) {
  const theme = useFormTheme();
  const { t, tr } = useScopedTranslation("sync");

  const requestClose = () => {
    if (!resolving) onClose();
  };

  if (!view) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={requestClose}
    >
      <View style={styles.dialogOverlay}>
        <Pressable
          accessible={false}
          onPress={requestClose}
          style={styles.dialogBackdrop}
        />

        <View
          accessibilityViewIsModal
          onAccessibilityEscape={requestClose}
          style={[
            styles.dialogCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.dialogHeader}>
            <ThemedText
              type="defaultSemiBold"
              accessibilityRole="header"
              style={styles.dialogTitle}
            >
              {tr(view.titleKey)}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("conflict.close")}
              accessibilityState={{ disabled: resolving }}
              disabled={resolving}
              onPress={onClose}
              style={({ pressed }) => [
                styles.dialogClose,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="close"
                size={22}
                color={theme.muted}
                accessible={false}
              />
            </Pressable>
          </View>

          <ThemedText
            style={[styles.dialogDescription, { color: theme.muted }]}
          >
            {tr(view.descriptionKey)}
          </ThemedText>

          <ScrollView
            style={styles.dialogBody}
            contentContainerStyle={styles.dialogBodyContent}
            showsVerticalScrollIndicator={false}
          >
            <SyncConflictValues title={t("conflict.mine")} fields={view.mine} />
            {view.remote.length > 0 ? (
              <SyncConflictValues
                title={t("conflict.remote")}
                fields={view.remote}
              />
            ) : (
              <ThemedText
                style={[styles.dialogDescription, { color: theme.muted }]}
              >
                {t("conflict.remoteGone")}
              </ThemedText>
            )}
          </ScrollView>

          <ErrorBanner message={errorMessage} />

          <SyncConflictActions
            options={view.options}
            disabled={resolving}
            onResolve={onResolve}
          />
        </View>
      </View>
    </Modal>
  );
}
