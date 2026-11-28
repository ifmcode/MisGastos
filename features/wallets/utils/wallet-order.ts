import { Wallet } from "../types/wallet.types";

export type WalletMoveDirection = "up" | "down";

export interface WalletOrderUpdate {
  id: string;
  sortOrder: number;
}

export interface WalletMoveResult {
  /** Full collection in its new canonical order. */
  wallets: Wallet[];
  /** Documents whose `sortOrder` must be persisted. */
  changed: WalletOrderUpdate[];
}

function getExplicitOrder(wallet: Wallet): number | null {
  const order = wallet.sortOrder;
  return typeof order === "number" && Number.isFinite(order) && order >= 0
    ? order
    : null;
}

/**
 * Previous wallet order: newest first, then name. Wallets without an explicit
 * position keep this order so an existing list does not change until the owner
 * reorders it.
 */
function compareLegacy(first: Wallet, second: Wallet): number {
  const createdComparison =
    new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();

  if (createdComparison !== 0) return createdComparison;
  return first.name.localeCompare(second.name);
}

/**
 * Canonical wallet order: explicit `sortOrder` ascending first, then the legacy
 * `createdAt` descending / `name` fallback. An explicit wallet always sorts
 * before a legacy one, so a newly created wallet (no position) appends after
 * the ordered list.
 */
export function compareWallets(first: Wallet, second: Wallet): number {
  const firstOrder = getExplicitOrder(first);
  const secondOrder = getExplicitOrder(second);

  if (firstOrder !== null && secondOrder !== null) {
    if (firstOrder !== secondOrder) return firstOrder - secondOrder;
    return compareLegacy(first, second);
  }

  if (firstOrder !== null) return -1;
  if (secondOrder !== null) return 1;

  return compareLegacy(first, second);
}

/**
 * Rewrites `sortOrder` as the array index and reports only the documents that
 * actually change. Legacy wallets receive their first explicit position here.
 */
export function renumberWallets(
  wallets: readonly Wallet[],
): WalletMoveResult {
  const ordered = wallets.map((wallet, index) => ({
    ...wallet,
    sortOrder: index,
  }));

  const changed = ordered.reduce<WalletOrderUpdate[]>(
    (updates, wallet, index) => {
      if (wallets[index]?.sortOrder !== wallet.sortOrder) {
        updates.push({ id: wallet.id, sortOrder: wallet.sortOrder });
      }
      return updates;
    },
    [],
  );

  return { wallets: ordered, changed };
}

/**
 * Builds the canonical order from a requested id sequence. Unknown and
 * duplicated ids are ignored and wallets missing from the sequence keep their
 * current order at the end, so a reorder can never lose one.
 */
export function applyWalletOrder(
  wallets: readonly Wallet[],
  orderedIds: readonly string[],
): WalletMoveResult {
  const byId = new Map(wallets.map((wallet) => [wallet.id, wallet]));
  const requested: Wallet[] = [];
  const requestedIds = new Set<string>();

  for (const rawId of orderedIds) {
    const id = rawId.trim();
    if (id.length === 0 || requestedIds.has(id)) continue;

    const wallet = byId.get(id);
    if (!wallet) continue;

    requestedIds.add(id);
    requested.push(wallet);
  }

  const remaining = wallets.filter((wallet) => !requestedIds.has(wallet.id));

  return renumberWallets([...requested, ...remaining]);
}

/**
 * Moves a wallet one step inside the visible list. Only the visible neighbours
 * swap, so archived wallets keep their relative position; the full collection
 * is renumbered afterwards so no position is lost.
 */
export function moveWallet(
  wallets: readonly Wallet[],
  walletId: string,
  direction: WalletMoveDirection,
  visibleIds: readonly string[],
): WalletMoveResult | null {
  const visible = visibleIds.filter((id) =>
    wallets.some((wallet) => wallet.id === id),
  );
  const visibleIndex = visible.indexOf(walletId);
  if (visibleIndex < 0) return null;

  const targetId = visible[visibleIndex + (direction === "up" ? -1 : 1)];
  if (!targetId) return null;

  const sourceIndex = wallets.findIndex((wallet) => wallet.id === walletId);
  const targetIndex = wallets.findIndex((wallet) => wallet.id === targetId);
  // Unreachable: every visible id comes from `wallets`, so both indices exist.
  // Kept as a safety net before indexing the array.
  if (sourceIndex < 0 || targetIndex < 0) return null;

  const next = [...wallets];
  next[sourceIndex] = wallets[targetIndex];
  next[targetIndex] = wallets[sourceIndex];

  return renumberWallets(next);
}
