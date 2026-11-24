import { isOfflineFirstEnabled } from "@/shared/lib/local-db/offline-first.flag";

import { OfflineBannerView } from "./offline-banner-view";

/**
 * Root overlay of the offline strip. The flag is read before rendering the
 * view, so the default (disabled) configuration never starts the NetInfo
 * subscription, reads the pathname or mounts the session consumer.
 */
export function OfflineBannerHost() {
  if (!isOfflineFirstEnabled()) return null;

  return <OfflineBannerView />;
}
