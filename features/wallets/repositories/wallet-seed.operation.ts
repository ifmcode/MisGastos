import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  runTransaction,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  CreateWalletDto,
  DefaultWalletSeedResult,
} from "../types/wallet.types";
import { buildDefaultWalletId } from "../utils/default-wallet";
import { buildWalletDocumentData } from "./wallet-document";
import {
  hasSeedMarker,
  resolveSeedCurrency,
  writeProfileMarker,
} from "./wallet-seed-profile";

const USERS_COLLECTION = "users";
const WALLET_COLLECTION = "wallets";

/** Profiles use auto ids with the Firebase uid in a field, not the doc id. */
async function findProfileDocumentId(ownerId: string): Promise<string | null> {
  const snapshot = await getDocs(
    query(
      collection(db, USERS_COLLECTION),
      where("uid", "==", ownerId),
      limit(1),
    ),
  );

  return snapshot.docs[0]?.id ?? null;
}

/**
 * The client SDK cannot query inside a transaction, so this owner check runs
 * outside it: a wallet created in that window can coexist with the seeded one
 * (accepted edge). Archived wallets keep their document, so they count too.
 */
async function ownerHasAnyWallet(ownerId: string): Promise<boolean> {
  const snapshot = await getDocs(
    query(
      collection(db, WALLET_COLLECTION),
      where("ownerId", "==", ownerId),
      limit(1),
    ),
  );

  return snapshot.docs.length > 0;
}

/**
 * Seeds the account's main wallet once. A `get` on a missing document is denied
 * by the rules instead of resolving as not-found, so only the profile query
 * result (a reference known to exist) is read inside the transaction; the
 * wallet is never read, and its deterministic id keeps two devices convergent.
 */
export async function seedDefaultWalletDocument(
  ownerId: string,
  dto: CreateWalletDto,
): Promise<DefaultWalletSeedResult> {
  const profileId = await findProfileDocumentId(ownerId);
  const hasWallets = await ownerHasAnyWallet(ownerId);

  const now = new Date().toISOString();
  const profileRef =
    profileId === null ? null : doc(db, USERS_COLLECTION, profileId);
  const walletId = buildDefaultWalletId(ownerId);
  const walletRef = doc(db, WALLET_COLLECTION, walletId);

  let result: DefaultWalletSeedResult = { status: "already-seeded" };

  await runTransaction(db, async (firestoreTransaction) => {
    // The query guarantees the document exists. A deletion between the query
    // and this read is denied by the rules, so the run fails silently and the
    // retry takes the no-profile path instead.
    const profileSnapshot = profileRef
      ? await firestoreTransaction.get(profileRef)
      : null;
    const profile =
      profileSnapshot === null
        ? null
        : (profileSnapshot.data() as Record<string, unknown>);

    // The marker is the only thing that stops a re-seed after the user deletes
    // every wallet, and a resume must not rewrite it.
    if (hasSeedMarker(profile)) {
      result = { status: "already-seeded" };
      return;
    }

    if (hasWallets) {
      if (profileRef) {
        writeProfileMarker(firestoreTransaction, profileRef, now);
      }
      result = { status: "skipped-existing-wallets" };
      return;
    }

    const currency = resolveSeedCurrency(profile, dto.currency);
    const data = buildWalletDocumentData(ownerId, { ...dto, currency }, now);

    firestoreTransaction.set(walletRef, data);
    // A profile-less account gets the wallet without the marker: the next load
    // sees "owner has wallets" and stamps it once the auth flow created it.
    if (profileRef) {
      writeProfileMarker(firestoreTransaction, profileRef, now);
    }

    result = { status: "seeded", wallet: { id: walletId, ...data } };
  });

  return result;
}
