/**
 * Joins the non-empty parts of a list row summary with a middle dot, matching
 * the movement and transfer card metadata format.
 */
export function joinMetaParts(
  parts: ReadonlyArray<string | null | undefined>,
  separator = " · ",
): string {
  return parts
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(separator);
}
