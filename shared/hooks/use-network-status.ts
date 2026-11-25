import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

import { resolveNetworkStatus } from "@/shared/utils/network-status";

export interface NetworkStatusState {
  isOffline: boolean;
}

/**
 * Subscribes to NetInfo and exposes only the binary "definitely offline" flag.
 * It starts as `false` and `unknown` counts as online, so consumers never flash
 * an offline state before the first probe resolves. Pass `enabled: false` to
 * avoid the subscription entirely (for example while a feature flag is off).
 */
export function useNetworkStatus(enabled = true): NetworkStatusState {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (!enabled) return undefined;

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(resolveNetworkStatus(state) === "offline");
    });

    return unsubscribe;
  }, [enabled]);

  return { isOffline };
}
