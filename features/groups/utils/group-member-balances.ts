import type { CurrencyCode } from "@/shared/constants/currencies";

/** Structural input: works with `GroupBalances` without importing the feature. */
export interface GroupBalancesSource {
  currencies: ReadonlyArray<{
    currency: CurrencyCode;
    balances: ReadonlyArray<{ userId: string; netCents: number }>;
  }>;
}

/** One non-zero net of a member, in the currency order of the balances. */
export interface MemberOutstandingBalance {
  currency: CurrencyCode;
  /** Positive: the group owes the member; negative: the member owes it. */
  netCents: number;
}

function readId(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Non-zero nets of one member, one entry per currency and in the order the
 * balances expose them. A settled member returns an empty list, which is the
 * leave/remove pre-check: no entry means the service may run.
 */
export function getMemberOutstandingBalances(
  balances: GroupBalancesSource | null,
  memberId: string | null | undefined,
): MemberOutstandingBalance[] {
  const id = readId(memberId);
  if (!balances || id.length === 0) return [];

  const outstanding: MemberOutstandingBalance[] = [];

  for (const group of balances.currencies) {
    const net = group.balances.find((item) => readId(item.userId) === id);
    if (!net || !Number.isFinite(net.netCents) || net.netCents === 0) continue;

    outstanding.push({ currency: group.currency, netCents: net.netCents });
  }

  return outstanding;
}

export interface OutstandingBalancesMessageOptions {
  /** Formats the absolute net in the currency; the caller owns the locale. */
  formatAmount: (netCents: number, currency: CurrencyCode) => string;
  owesGroup: (amount: string) => string;
  groupOwes: (amount: string) => string;
  /** Optional sentence prepended on its own line. */
  intro?: string;
}

/**
 * One line per currency with the direction of its net, joined with line breaks.
 * Direction comes from the sign: negative owes the group, positive is owed by
 * it. Copy and formatting stay in the caller so the helper is language-free.
 */
export function buildOutstandingBalancesMessage(
  balances: readonly MemberOutstandingBalance[],
  {
    formatAmount,
    owesGroup,
    groupOwes,
    intro,
  }: OutstandingBalancesMessageOptions,
): string {
  const lines = balances.map((item) => {
    const amount = formatAmount(Math.abs(item.netCents), item.currency);

    return item.netCents < 0 ? owesGroup(amount) : groupOwes(amount);
  });

  return [intro, ...lines]
    .filter((line): line is string => Boolean(line && line.trim()))
    .join("\n");
}
