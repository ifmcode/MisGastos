import { useRouter, type Href } from "expo-router";
import { useCallback } from "react";

export interface DetailCloseNavigationOptions {
  /** Friend detail used only when there is no screen to return to. */
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
 * Close action of a shared detail (settlement, shared expense). Back returns to
 * the screen the detail was opened from, so a notification lands on the inbox
 * or on whatever screen the banner interrupted. A deep link without history
 * falls back to the friend detail, or to the Social hub without a friend.
 */
export function useDetailCloseNavigation({
  friendUid,
}: DetailCloseNavigationOptions): () => void {
  const router = useRouter();
  const parent = parentHref(friendUid);

  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(parent);
  }, [parent, router]);
}
