import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

import { resolveNetworkStatus } from "../utils/network-status";

export interface NetworkStatusState {
  isOffline: boolean;
}

/**
 * Subscribes to NetInfo for the whole app lifetime and exposes only the binary
 * "definitely offline" flag. It starts as `false` and `unknown` counts as
 * online, so the offline strip never flashes before the first probe resolves.
 */
export function useNetworkStatus(): NetworkStatusState {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(resolveNetworkStatus(state) === "offline");
    });

    return unsubscribe;
  }, []);

  return { isOffline };
}
