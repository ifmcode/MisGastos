import type { Friend } from "@/features/friends/types/friend.types";
import type { FriendDetailHeader } from "@/features/friends/utils/friend-detail";
import type { SharedExpenseEditorController } from "@/features/shared-expenses/hooks/use-shared-expense-editor";

import type { FriendRemovalController } from "../hooks/use-friend-removal";
import type { FriendTimelineEntry } from "../utils/friend-timeline";

export type FriendDetailStatus = "loading" | "error" | "missing" | "ready";

export interface UseFriendDetailScreenOptions {
  /** Route uid, already normalized to a single string. */
  uid: string;
}

/** Everything the friend detail screen renders, composed by its hook. */
export interface FriendDetailScreenController {
  status: FriendDetailStatus;
  header: FriendDetailHeader | null;
  /** Friends of the overview, used by the timeline rows to resolve names. */
  friends: Friend[];
  /** Overview error: full-screen without a friend, banner otherwise. */
  error: string | null;
  refreshing: boolean;
  reload: () => void;
  refresh: () => void;
  /** Open cycle: pair entries created after the settled boundary. */
  timelineCurrent: FriendTimelineEntry[];
  /** Settled history: pair entries created at or before the boundary. */
  timelineSettled: FriendTimelineEntry[];
  timelineLoading: boolean;
  timelineError: string | null;
  reloadTimeline: () => void;
  /** Expanded flag of the settled block; reset whenever the boundary moves. */
  showSettled: boolean;
  /** No-op while there is no settled history to show. */
  toggleSettled: () => void;
  /** Viewer uid, already normalized to a string for the timeline rows. */
  viewerUid: string;
  /** Remaining friend failure, announced in its own banner. */
  removalError: string | null;
  editor: SharedExpenseEditorController;
  removal: FriendRemovalController;
}
