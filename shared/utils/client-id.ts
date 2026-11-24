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
