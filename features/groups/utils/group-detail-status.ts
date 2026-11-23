export type GroupDetailStatus = "loading" | "error" | "missing" | "ready";

/** The detail controller flags that decide the route status. */
export interface GroupDetailStatusState {
  /** The detail reported that the viewer cannot read the group. */
  missing: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Route status of the group detail: a missing group wins because it has its own
 * state, then the loaded detail, then the initial load and finally the error.
 */
export function getGroupDetailStatus(
  { missing, loading, error }: GroupDetailStatusState,
  hasDetail: boolean,
): GroupDetailStatus {
  if (missing) return "missing";
  if (hasDetail) return "ready";
  if (loading) return "loading";
  if (error) return "error";

  return "missing";
}
