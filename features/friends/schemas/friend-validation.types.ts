export const FRIEND_EMAIL_MAX_LENGTH = 254;
export const FRIEND_DISPLAY_NAME_MAX_LENGTH = 50;

export type FriendValidationField =
  | "uid"
  | "requesterId"
  | "recipientId"
  | "email"
  | "displayName";

export type FriendValidationCode =
  | "UID_REQUIRED"
  | "REQUESTER_REQUIRED"
  | "RECIPIENT_REQUIRED"
  | "SAME_USER"
  | "EMAIL_REQUIRED"
  | "EMAIL_INVALID"
  | "EMAIL_TOO_LONG"
  | "DISPLAY_NAME_TOO_LONG";

export interface FriendValidationIssue {
  field: FriendValidationField;
  code: FriendValidationCode;
}

export type FriendValidationErrors = Partial<
  Record<FriendValidationField, FriendValidationCode>
>;
