import { useSyncExternalStore } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  dismissDevLog,
  getDevLogSnapshot,
  subscribeDevLogs,
} from "@/lib/dev-log.store";

import { DevLogCard } from "../molecules/dev-log-card";
import { devLogOverlayStyles as styles } from "./dev-log-overlay.styles";

/**
 * Dev-only themed stack that replaces the LogBox notification cards. It reads
 * the store fed by `lib/dev-logbox.ts`, so a warning that fires before the
 * first render is still shown when this overlay mounts.
 */
export function DevLogOverlay() {
  const entries = useSyncExternalStore(subscribeDevLogs, getDevLogSnapshot);
  const insets = useSafeAreaInsets();

  if (!__DEV__ || entries.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.overlay, { top: insets.top + 8 }]}
    >
      {entries.map((entry) => (
        <DevLogCard
          key={entry.id}
          entry={entry}
          onDismiss={() => dismissDevLog(entry.id)}
        />
      ))}
    </View>
  );
}
