import type { IGroupBalancePort } from "./group-balance.port";
import { GroupOperationError } from "./group.errors";

/**
 * A member may leave or be removed only when their net is zero in every
 * currency; otherwise the outstanding debt would be orphaned. Rules cannot sum
 * the ledger, so the guard lives here and a hand-crafted client can still
 * bypass it (accepted V1 trade-off).
 *
 * The read happens before the write transaction, so a settlement applied in
 * between can leave a stale "settled" verdict: the same accepted race as the
 * settlement amount bound, and the next leave/removal attempt reads again.
 */
export async function assertGroupMemberSettled(
  balances: IGroupBalancePort,
  groupId: string,
  memberId: string,
): Promise<void> {
  const nets = await balances.getMemberNets(groupId, memberId);

  if (nets.some((net) => net.netCents !== 0)) {
    throw new GroupOperationError("BALANCE_NOT_SETTLED");
  }
}
