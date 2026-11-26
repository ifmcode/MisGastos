/**
 * Money is stored as a decimal number rounded to 2 decimals. Every
 * calculation goes through this helper to avoid float drift.
 */
export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;

  const sign = value < 0 ? -1 : 1;
  const absolute = Math.abs(value);
  const tolerance = Number.EPSILON * Math.max(1, absolute);
  const rounded = Math.round((absolute + tolerance) * 100) / 100;

  return sign * rounded;
}
