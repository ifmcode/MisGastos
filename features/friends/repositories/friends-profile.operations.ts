import {
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
  collection,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { assertServerSnapshot } from "@/shared/lib/local-db/offline-read";

import type { PublicProfile, PublicProfileInput } from "../types/friend.types";
import { mapPublicProfileDocument } from "./friends.mapper";

export const PUBLIC_PROFILES_COLLECTION = "publicProfiles";

export async function getPublicProfileOperation(
  uid: string,
): Promise<PublicProfile | null> {
  const snapshot = await getDoc(doc(db, PUBLIC_PROFILES_COLLECTION, uid));
  if (!snapshot.exists()) return null;

  return mapPublicProfileDocument(
    uid,
    snapshot.data() as Record<string, unknown>,
  );
}

/** Exact normalized email lookup; the email is stored trimmed and lowercase. */
export async function findPublicProfileByEmailOperation(
  email: string,
): Promise<PublicProfile | null> {
  const snapshot = await getDocs(
    query(
      collection(db, PUBLIC_PROFILES_COLLECTION),
      where("email", "==", email),
      limit(1),
    ),
  );

  const document = snapshot.docs[0];
  if (!document) return null;

  return mapPublicProfileDocument(
    document.id,
    document.data() as Record<string, unknown>,
  );
}

/**
 * Resolves list rows with one `getDoc` per uid. A `in` query would cap the
 * batch at ten ids and the friends list is small, so no index is required.
 */
export async function getPublicProfilesOperation(
  uids: readonly string[],
): Promise<PublicProfile[]> {
  const snapshots = await Promise.all(
    uids.map((uid) => getPublicProfileOperation(uid)),
  );

  return snapshots.filter((profile): profile is PublicProfile => !!profile);
}

export async function ensurePublicProfileOperation(
  input: PublicProfileInput,
): Promise<PublicProfile> {
  const now = new Date().toISOString();
  const reference = doc(db, PUBLIC_PROFILES_COLLECTION, input.uid);
  const snapshot = await getDoc(reference);

  if (snapshot.exists()) {
    const update = {
      displayName: input.displayName,
      email: input.email,
      updatedAt: now,
    };

    await updateDoc(reference, update);

    return mapPublicProfileDocument(input.uid, {
      ...(snapshot.data() as Record<string, unknown>),
      ...update,
    });
  }

  const data = {
    uid: input.uid,
    displayName: input.displayName,
    email: input.email,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(reference, data);

  return mapPublicProfileDocument(input.uid, data);
}
