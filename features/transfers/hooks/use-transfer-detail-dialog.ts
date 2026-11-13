import { useMemo, useReducer } from "react";

import { Transfer } from "../types/transfer.types";
import {
  findTransferForDetail,
  INITIAL_TRANSFER_DETAIL_STATE,
  transferDetailReducer,
} from "../utils/transfer-detail-state";

export interface TransferDetailDialog {
  visible: boolean;
  transfer: Transfer | null;
  open: (transfer: Transfer) => void;
  close: () => void;
}

/** Owns the open/close lifecycle of the read-only transfer detail view. */
export function useTransferDetailDialog(
  transfers: readonly Transfer[],
): TransferDetailDialog {
  const [state, dispatch] = useReducer(
    transferDetailReducer,
    INITIAL_TRANSFER_DETAIL_STATE,
  );
  const transfer = useMemo(
    () => findTransferForDetail(transfers, state.selectedId),
    [transfers, state.selectedId],
  );

  return {
    visible: state.selectedId !== null,
    transfer,
    open: (selected) => dispatch({ type: "open", transferId: selected.id }),
    close: () => dispatch({ type: "close" }),
  };
}
