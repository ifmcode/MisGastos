import type { GroupErrorCode } from "../services/group.errors";

/** Errors that mean the group is not readable by this viewer. */
export const MISSING_GROUP_CODES: readonly GroupErrorCode[] = [
  "GROUP_NOT_FOUND",
  "NOT_GROUP_MEMBER",
  "PERMISSION_DENIED",
];
