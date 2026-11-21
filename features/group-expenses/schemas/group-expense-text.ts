/** Trims a string field; anything that is not a string reads as empty. */
export function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
