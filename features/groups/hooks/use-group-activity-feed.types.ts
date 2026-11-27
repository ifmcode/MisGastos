import type { GroupActivity } from "../types/group-activity.types";

export interface UseGroupActivityFeedOptions {
  viewerUid: string | undefined;
  groupId: string;
}

/** Feed state consumed by the group detail activity section. */
export interface GroupActivityFeedController {
  items: GroupActivity[];
  /** First page still resolving. */
  loading: boolean;
  loadingMore: boolean;
  /** Banner copy that keeps the loaded feed on screen. */
  error: string | null;
  hasMore: boolean;
  reload: () => void;
  loadMore: () => void;
}
