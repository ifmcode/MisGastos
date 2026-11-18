import type { Settlement, SettlementInput } from "../types/settlement.types";
import {
  getCurrencyNetBalanceCents,
  getSettlementDebtorCreditor,
  isSettlementFull,
} from "../utils/settlement-debt";
import { buildSettlementNotificationInput } from "../utils/settlement-notification";
import { SettlementOperationError } from "./settlement.errors";
import {
  assertCreditorWallet,
  assertSettlementDebtBound,
  assertSettlementFriendship,
  loadSettlementBalances,
  validateSettlementOrThrow,
} from "./settlement-guards";
import {
  buildCreateSettlementDto,
  buildSettlementParticipantIds,
} from "./settlement-persist";
import type { SettlementWriteDeps } from "./settlement-write-deps";

/**
 * Applies a settlement directly: there is no counterpart confirmation. The
 * direction comes from the signed net of the chosen currency, and both sides can
 * create it, so "I paid" and "they paid me" share one path.
 */
export async function createSettlementWithRepository(
  deps: SettlementWriteDeps,
  viewerUid: string,
  input: SettlementInput,
): Promise<Settlement> {
  const value = validateSettlementOrThrow(input, viewerUid);

  await assertSettlementFriendship(
    deps.friendsRepository,
    viewerUid,
    value.friendUid,
  );

  const participantIds = buildSettlementParticipantIds(
    viewerUid,
    value.friendUid,
  );
  const balances = await loadSettlementBalances(
    deps.ledgerRepository,
    viewerUid,
    value.friendUid,
  );
  const direction = getSettlementDebtorCreditor({
    viewerUid,
    friendUid: value.friendUid,
    netBalanceCents: getCurrencyNetBalanceCents(balances, value.currency),
  });

  if (!direction) throw new SettlementOperationError("NO_DEBT");

  assertCreditorWallet(value, direction.viewerIsCreditor);
  assertSettlementDebtBound(balances, value.currency, value.amountCents);

  const now = new Date().toISOString();
  const dto = buildCreateSettlementDto({
    value,
    participantIds,
    direction,
    viewerUid,
    now,
  });
  const isFull = isSettlementFull(balances, value.currency, value.amountCents);

  return deps.repository.createSettlement(dto, (settlement) =>
    buildSettlementNotificationInput({
      settlement,
      event: "created",
      recipientUid: value.friendUid,
      actorUid: viewerUid,
      isFull,
      canLinkWallet: !direction.viewerIsCreditor,
    }),
  );
}
