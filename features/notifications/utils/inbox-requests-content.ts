/**
 * Minimal state of the Pendientes queue; the full inbox controller satisfies
 * it, so the pure helper stays easy to test.
 */
export interface InboxRequestsContentState {
  total: number;
  loading: boolean;
  groupsLoading: boolean;
  error: string | null;
  actionError: string | null;
  groupError: string | null;
  groupActionError: string | null;
  ownerJoinRequests: {
    loading: boolean;
    error: string | null;
    actionError: string | null;
  };
}

/**
 * Whether the queue has anything to render: rows, an inline loader or a
 * failure. The list empty state only shows when this is false, so a loading or
 * failed queue is never hidden behind "no pending notifications".
 */
export function hasInboxRequestsContent(
  state: InboxRequestsContentState,
): boolean {
  return (
    state.total > 0 ||
    state.loading ||
    state.groupsLoading ||
    state.ownerJoinRequests.loading ||
    !!state.error ||
    !!state.actionError ||
    !!state.groupError ||
    !!state.groupActionError ||
    !!state.ownerJoinRequests.error ||
    !!state.ownerJoinRequests.actionError
  );
}
