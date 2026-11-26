import {
  addDoc,
  collection,
  deleteField,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { readClientDocumentId } from "@/shared/utils/client-id";
import { nextRevision } from "@/shared/utils/revision";

import { WalletOperationError } from "../services/wallet.errors";
import {
  CreateWalletDto,
  UpdateWalletDto,
  Wallet,
} from "../types/wallet.types";
import { roundMoney } from "@/shared/utils/money";
import { buildWalletDocumentData } from "./wallet-document";
import { mapWalletDocument } from "./wallet.mapper";

const WALLET_COLLECTION = "wallets";

async function loadOwnedWallet(
  ownerId: string,
  walletId: string,
): Promise<Wallet | null> {
  const snapshot = await getDoc(doc(db, WALLET_COLLECTION, walletId));
  if (!snapshot.exists()) return null;

  const data = snapshot.data() as Record<string, unknown>;
  if (data.ownerId !== ownerId) return null;

  return mapWalletDocument(snapshot.id, data, ownerId);
}

export async function createWalletDocument(
  ownerId: string,
  dto: CreateWalletDto,
): Promise<Wallet> {
  const now = new Date().toISOString();
  const data = buildWalletDocumentData(ownerId, dto, now);
  const providedId = readClientDocumentId(dto.id);

  if (providedId) {
    await setDoc(doc(db, WALLET_COLLECTION, providedId), data);
    return { id: providedId, ...data };
  }

  const walletsRef = collection(db, WALLET_COLLECTION);
  const reference = await addDoc(walletsRef, data);

  return { id: reference.id, ...data };
}

export async function updateWalletDocument(
  ownerId: string,
  walletId: string,
  dto: UpdateWalletDto,
): Promise<Wallet> {
  const existing = await loadOwnedWallet(ownerId, walletId);
  if (!existing) throw new WalletOperationError("WALLET_NOT_FOUND");

  const now = new Date().toISOString();
  const data: Record<string, unknown> = {
    updatedAt: now,
    revision: nextRevision(existing),
  };

  if (dto.name !== undefined) data.name = dto.name;
  if (dto.icon !== undefined) data.icon = dto.icon;
  if (dto.color !== undefined) data.color = dto.color;
  if (dto.type !== undefined) data.type = dto.type;
  if (dto.includeInTotal !== undefined) {
    data.includeInTotal = dto.includeInTotal;
  }
  if (dto.description !== undefined) {
    data.description = dto.description.trim()
      ? dto.description.trim()
      : deleteField();
  }
  if (dto.initialBalance !== undefined) {
    const initialBalance = roundMoney(dto.initialBalance);
    data.initialBalance = initialBalance;
    data.balance = initialBalance;
  }

  await updateDoc(doc(db, WALLET_COLLECTION, walletId), data);

  const updated = await loadOwnedWallet(ownerId, walletId);
  if (!updated) throw new WalletOperationError("WALLET_NOT_FOUND");
  return updated;
}

export async function setWalletArchivedDocument(
  ownerId: string,
  walletId: string,
  archivedAt: string | null,
): Promise<Wallet> {
  const existing = await loadOwnedWallet(ownerId, walletId);
  if (!existing) throw new WalletOperationError("WALLET_NOT_FOUND");

  const now = new Date().toISOString();
  await updateDoc(doc(db, WALLET_COLLECTION, walletId), {
    archivedAt: archivedAt ?? deleteField(),
    updatedAt: now,
    revision: nextRevision(existing),
  });

  const updated = await loadOwnedWallet(ownerId, walletId);
  if (!updated) throw new WalletOperationError("WALLET_NOT_FOUND");
  return updated;
}
