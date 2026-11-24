/** NetInfo values are three-state: `null` means "not measured yet". */
export type NetworkStatus = "online" | "offline" | "unknown";

export interface NetworkStateSnapshot {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}

/**
 * Collapses the NetInfo snapshot into one status. An explicit `false` from
 * either flag wins, because a device can report a Wi-Fi link and still be
 * unable to reach the internet. Reachability is never treated as offline when
 * it is `null`: an unmeasured probe must not hide connectivity.
 */
export function resolveNetworkStatus(
  state: NetworkStateSnapshot,
): NetworkStatus {
  if (state.isConnected === false || state.isInternetReachable === false) {
    return "offline";
  }

  if (state.isConnected === null) return "unknown";

  return "online";
}
