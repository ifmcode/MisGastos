import type { Settlement } from "../types/settlement.types";
import { canEditSettlementAmount } from "./settlement-debt";
import { isActiveSettlement } from "./settlement-ledger";

/** Direction-free facts the settlement detail needs for one viewer. */
export interface SettlementViewerDetail {
  settlement: Settlement;
  friendUid: string;
  viewerIsCreditor: boolean;
  isActive: boolean;
  hasReceiverWallet: boolean;
  /** Only the creditor can link, and only while no movement exists yet. */
  canLinkWallet: boolean;
  canEditAmount: boolean;
}

/** Safe statuses of the settlement detail route. */
export type SettlementDetailStatus = "loading" | "error" | "missing" | "ready";

/**
 * A settled record always resolves to ready or missing, so a stale list error
 * never replaces a record that is already loaded.
 */
export function getSettlementDetailStatus({
  settlement,
  detail,
  loading,
  error,
}: {
  settlement: Settlement | null;
  detail: SettlementViewerDetail | null;
  loading: boolean;
  error: string | null;
}): SettlementDetailStatus {
  if (settlement) return detail ? "ready" : "missing";

  return loading ? "loading" : error ? "error" : "missing";
}

/**
 * Pure projection of a settlement for the signed-in participant. It carries no
 * copy: the UI resolves the labels from these flags. Returns `null` when the
 * viewer is not a participant or the pair is malformed.
 */
export function buildSettlementViewerDetail(
  settlement: Settlement,
  viewerUid: string,
): SettlementViewerDetail | null {
  if (!settlement.participantIds.includes(viewerUid)) return null;

  const friendUid =
    settlement.participantIds.find((uid) => uid !== viewerUid) ?? "";
  if (friendUid.length === 0) return null;

  const viewerIsCreditor = settlement.toUserId === viewerUid;
  const isActive = isActiveSettlement(settlement);

  return {
    settlement,
    friendUid,
    viewerIsCreditor,
    isActive,
    hasReceiverWallet: settlement.receiverWalletId !== null,
    canLinkWallet:
      viewerIsCreditor && isActive && settlement.receiverTransactionId === null,
    canEditAmount: canEditSettlementAmount(settlement, viewerUid),
  };
}
