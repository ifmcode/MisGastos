import { addDoc, collection, getDocs, orderBy, query } from "firebase/firestore";

import { db } from "@/lib/firebase";

import { CreateWalletDto, Wallet } from "../types/wallet.types";
import { roundMoney } from "../utils/money";
import { IWalletRepository } from "./wallet.repository";
import { mapWalletDocument } from "./wallet.mapper";

export class FirebaseWalletRepository implements IWalletRepository {
  async getWallets(ownerId: string): Promise<Wallet[]> {
    const walletsRef = collection(db, "users", ownerId, "wallets");
    const snapshot = await getDocs(query(walletsRef, orderBy("createdAt", "desc")));

    const wallets: Wallet[] = [];

    for (const document of snapshot.docs) {
      const wallet = mapWalletDocument(document.id, document.data(), ownerId);
      if (wallet) wallets.push(wallet);
    }

    return wallets;
  }

  async createWallet(ownerId: string, dto: CreateWalletDto): Promise<Wallet> {
    const now = new Date().toISOString();
    const initialBalance = roundMoney(dto.initialBalance);

    const data = {
      name: dto.name,
      currency: dto.currency,
      icon: dto.icon,
      color: dto.color,
      initialBalance,
      balance: initialBalance,
      type: dto.type,
      includeInTotal: dto.includeInTotal,
      ownerId,
      createdAt: now,
      updatedAt: now,
      ...(dto.description ? { description: dto.description } : {}),
    };

    const walletsRef = collection(db, "users", ownerId, "wallets");
    const reference = await addDoc(walletsRef, data);

    return { id: reference.id, ...data };
  }
}
