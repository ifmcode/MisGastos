let pendingVerificationUid: string | null = null;

/** Marks the account that has just registered and needs its first email. */
export function markPendingVerificationEmail(uid: string): void {
  pendingVerificationUid = uid;
}

/** Returns true only once for the account marked after registration. */
export function consumePendingVerificationEmail(uid: string): boolean {
  if (pendingVerificationUid !== uid) {
    return false;
  }

  pendingVerificationUid = null;
  return true;
}

/** Clears the session flag; used by tests and sign-out flows. */
export function resetPendingVerificationEmail(): void {
  pendingVerificationUid = null;
}
