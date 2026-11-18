import { useRouter, type Href } from "expo-router";
import { useCallback } from "react";

export interface DetailCloseNavigationOptions {
  /** The detail was opened from a notification, so back must replace it. */
  fromNotification: boolean;
  /** Friend detail it returns to; without one the Social hub is the parent. */
  friendUid: string | null;
}

function parentHref(friendUid: string | null): Href {
  return (
    friendUid
      ? `/social/friends/${encodeURIComponent(friendUid.trim())}`
      : "/(tabs)/social"
  ) as Href;
}

/**
 * Close action of a shared detail (settlement, shared expense). A notification
 * target always resolves to the friend detail — the inbox is never the parent of
 * a detail — and a target that no longer exists still lands on a valid route.
 * Opened any other way, the stack simply pops.
 */
export function useDetailCloseNavigation({
  fromNotification,
  friendUid,
}: DetailCloseNavigationOptions): () => void {
  const router = useRouter();
  const parent = parentHref(friendUid);

  return useCallback(() => {
    if (fromNotification) {
      router.replace(parent);
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(parent);
  }, [fromNotification, parent, router]);
}
