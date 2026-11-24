import type { GroupActivity } from "../types/group-activity.types";

export interface UseGroupActivityFeedOptions {
  viewerUid: string | undefined;
  groupId: string;
}

/** Feed state consumed by the history route; the detail lives in its hook. */
export interface GroupActivityFeedController {
  items: GroupActivity[];
  /** First page still resolving. */
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  /** Banner copy that keeps the loaded feed on screen. */
  error: string | null;
  hasMore: boolean;
  reload: () => void;
  refresh: () => Promise<void>;
  loadMore: () => void;
}
