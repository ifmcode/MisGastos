export type NotificationOperationCode =
  | "SIGN_IN_REQUIRED"
  | "NOTIFICATION_NOT_FOUND"
  | "NOT_OWNER";

export type NotificationErrorCode =
  | NotificationOperationCode
  | "PERMISSION_DENIED"
  | "NETWORK"
  | "LOAD_FAILED"
  | "SAVE_FAILED";

export class NotificationOperationError extends Error {
  readonly code: NotificationOperationCode;

  constructor(code: NotificationOperationCode) {
    super(code);
    this.name = "NotificationOperationError";
    this.code = code;
  }
}

function readErrorCode(error: Error): string | null {
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

/** Stable codes only: the inbox translates them, never the service. */
export function getNotificationErrorCode(
  error: unknown,
  fallback: NotificationErrorCode = "LOAD_FAILED",
): NotificationErrorCode {
  if (error instanceof NotificationOperationError) return error.code;

  if (error instanceof Error) {
    const code = readErrorCode(error);
    if (code === "permission-denied") return "PERMISSION_DENIED";
    if (code === "unavailable" || code === "network-request-failed") {
      return "NETWORK";
    }
  }

  return fallback;
}
