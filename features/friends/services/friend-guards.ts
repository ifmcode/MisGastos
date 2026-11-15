import { validateFriendViewerId } from "../schemas/friend.schema";
import type { FriendRequest } from "../types/friend.types";
import { FriendOperationError, FriendValidationError } from "./friend.errors";

/** Normalizes the signed-in uid or throws a field-level validation error. */
export function requireViewerId(value: string): string {
  const validation = validateFriendViewerId(value);

  if (!validation.ok) throw new FriendValidationError(validation.error);

  return validation.value;
}

export function assertViewerIsRecipient(
  request: FriendRequest,
  viewerUid: string,
): void {
  if (request.recipientId !== viewerUid) {
    throw new FriendOperationError("NOT_REQUEST_RECIPIENT");
  }
}

export function assertViewerIsSender(
  request: FriendRequest,
  viewerUid: string,
): void {
  if (request.requesterId !== viewerUid) {
    throw new FriendOperationError("NOT_REQUEST_SENDER");
  }
}

export function assertRequestIsPending(request: FriendRequest): void {
  if (request.status !== "pending") {
    throw new FriendOperationError("REQUEST_NOT_PENDING");
  }
}
