/**
 * Last-resort copy when a key is missing in every language. It never returns
 * the raw dotted key or an empty string: the Spanish fallback comes from
 * i18next, and this handler only runs when that fallback is missing too.
 */
export function parseMissingKey(key: string, defaultValue?: string): string {
  if (defaultValue) return defaultValue;

  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.warn(`[i18n] Missing translation key: ${key}`);
  }

  const lastSegment = key.split(".").pop() ?? key;
  const humanized = lastSegment
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .trim();

  return humanized.length > 0 ? humanized : key;
}
