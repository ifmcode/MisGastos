import { useRouter, type Href } from "expo-router";
import { useCallback } from "react";

export interface UseGroupExpenseCloseNavigationOptions {
  /** Group the detail belongs to; null falls back to the Social hub. */
  groupId: string | null;
}

/** Back action of the group-expense detail: the group detail or the hub. */
export function useGroupExpenseCloseNavigation({
  groupId,
}: UseGroupExpenseCloseNavigationOptions): () => void {
  const router = useRouter();
  const group = groupId?.trim() ?? "";
  const parent = (group
    ? `/social/groups/${encodeURIComponent(group)}`
    : "/(tabs)/social") as Href;

  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(parent);
  }, [parent, router]);
}
