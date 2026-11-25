import { usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/use-auth";
import { useNetworkStatus } from "@/shared/hooks/use-network-status";
import { getBannerBottomOffset, isTabRoute } from "../utils/banner-offset";
import { OfflineBanner } from "./offline-banner";

/**
 * Resolves the connectivity, session and layout inputs of the strip. It is a
 * separate component so its hooks (including the NetInfo subscription) only
 * mount once `OfflineBannerHost` has confirmed the feature flag is on.
 */
export function OfflineBannerView() {
  const { user } = useAuth();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { isOffline } = useNetworkStatus();

  if (!user || !isOffline) return null;

  return (
    <OfflineBanner
      bottomOffset={getBannerBottomOffset({
        isTabRoute: isTabRoute(pathname),
        bottomInset: insets.bottom,
      })}
    />
  );
}
