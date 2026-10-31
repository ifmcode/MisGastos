import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import { CreateTransferDto, Transfer, UpdateTransferDto } from "../types/transfer.types";
import { sortTransfersByDate } from "../utils/transfer-sort";
import { createTransferOperation } from "./transfer-create.operation";
import { deleteTransferOperation } from "./transfer-delete.operation";
import { mapTransferDocument } from "./transfer.mapper";
import { updateTransferOperation } from "./transfer-update.operation";
import {
  ITransferRepository,
  TransferMutationResult,
} from "./transfer.repository";

/** Firestore-backed transfers. Write flows live in their own operation files. */
export class FirebaseTransferRepository implements ITransferRepository {
  async getTransfers(ownerId: string): Promise<Transfer[]> {
    const transfersRef = collection(db, "transfers");
    const snapshot = await getDocs(
      query(transfersRef, where("ownerId", "==", ownerId)),
    );

    const transfers: Transfer[] = [];

    for (const document of snapshot.docs) {
      const transfer = mapTransferDocument(
        document.id,
        document.data() as Record<string, unknown>,
        ownerId,
      );
      if (transfer && !transfer.deletedAt) transfers.push(transfer);
    }

    return sortTransfersByDate(transfers);
  }

  async getTransfer(
    ownerId: string,
    transferId: string,
  ): Promise<Transfer | null> {
    const snapshot = await getDoc(doc(db, "transfers", transferId));

    if (!snapshot.exists()) return null;

    const data = snapshot.data() as Record<string, unknown>;
    if (data.ownerId !== ownerId) return null;

    const transfer = mapTransferDocument(transferId, data, ownerId);

    return transfer && !transfer.deletedAt ? transfer : null;
  }

  createTransfer(
    ownerId: string,
    dto: CreateTransferDto,
  ): Promise<TransferMutationResult> {
    return createTransferOperation(ownerId, dto);
  }

  updateTransfer(
    ownerId: string,
    transferId: string,
    dto: UpdateTransferDto,
  ): Promise<TransferMutationResult> {
    return updateTransferOperation({ ownerId, transferId, dto });
  }

  deleteTransfer(
    ownerId: string,
    transferId: string,
  ): Promise<TransferMutationResult> {
    return deleteTransferOperation(ownerId, transferId);
  }
}
