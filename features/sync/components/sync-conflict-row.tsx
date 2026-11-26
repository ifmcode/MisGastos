import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { syncStyles as styles } from "../styles/sync.styles";
import type { SyncConflictView } from "../utils/sync-conflict-view";

export interface SyncConflictRowProps {
  view: SyncConflictView;
  onPress: () => void;
}

/** Pressable conflict entry: kind, one-line reason and the chevron. */
export function SyncConflictRow({ view, onPress }: SyncConflictRowProps) {
  const theme = useFormTheme();
  const { t, tr } = useScopedTranslation("sync");
  const title = tr(view.titleKey);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={t("center.openConflictHint")}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <View
        style={[
          styles.conflictRow,
          { borderColor: theme.border, backgroundColor: theme.surface },
        ]}
      >
        <View
          style={[styles.conflictIcon, { backgroundColor: theme.dangerSurface }]}
        >
          <Ionicons
            name="alert-circle-outline"
            size={20}
            color={theme.danger}
            accessible={false}
          />
        </View>
        <View style={styles.conflictBody}>
          <ThemedText style={styles.conflictTitle}>{title}</ThemedText>
          <ThemedText
            style={[styles.conflictMeta, { color: theme.muted }]}
            numberOfLines={2}
          >
            {tr(view.descriptionKey)}
          </ThemedText>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.muted}
          accessible={false}
        />
      </View>
    </Pressable>
  );
}
