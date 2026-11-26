/**
 * Optional client-generated document id carried by a create DTO. The value is
 * trimmed and a blank or non-string one is ignored, so the create path falls
 * back to a generated reference.
 */
export function readClientDocumentId(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

const MAX_CLIENT_ID_LENGTH = 20;
const MAX_SEQUENCE = 46656;

let sequence = 0;

/**
 * Firestore-style client-generated document id (`YYYY` base-36 timestamp plus a
 * monotonic counter plus randomness), ~20 characters and never containing `/`.
 * Not cryptographic: it only needs to be unique across local writes and stable
 * enough to reference a record before it syncs.
 */
export function createClientId(): string {
  const time = Date.now().toString(36);
  const counter = (sequence % MAX_SEQUENCE).toString(36).padStart(3, "0");
  const random = Math.random()
    .toString(36)
    .slice(2, 11)
    .padEnd(9, "0");

  sequence += 1;

  return `${time}${counter}${random}`.slice(0, MAX_CLIENT_ID_LENGTH);
}
