import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import { Profile, ValidatedProfileSaveInput } from "../types/profile.types";
import { mapProfileDocument } from "./profile.mapper";
import type { IProfileRepository } from "./profile.repository";

const USERS_COLLECTION = "users";

/**
 * The existing auth flow stores profiles under auto-generated ids with the
 * Firebase uid in a `uid` field. Reading by uid avoids a data migration and
 * guarantees a single profile document per account.
 */
async function findProfileDocument(uid: string) {
  const snapshot = await getDocs(
    query(collection(db, USERS_COLLECTION), where("uid", "==", uid)),
  );

  return snapshot.docs[0] ?? null;
}

export class FirebaseProfileRepository implements IProfileRepository {
  async getProfile(uid: string): Promise<Profile | null> {
    const document = await findProfileDocument(uid);
    if (!document) return null;

    return mapProfileDocument(document.id, document.data(), { uid });
  }

  async saveProfile(input: ValidatedProfileSaveInput): Promise<Profile> {
    const existing = await findProfileDocument(input.uid);
    const now = new Date().toISOString();

    if (existing) {
      const update = {
        name: input.displayName,
        preferredCurrency: input.preferredCurrency,
        updatedAt: now,
        ...(input.email ? { email: input.email } : {}),
      };

      await updateDoc(doc(db, USERS_COLLECTION, existing.id), update);

      return mapProfileDocument(
        existing.id,
        { ...existing.data(), ...update },
        { uid: input.uid, email: input.email },
      );
    }

    const data = {
      uid: input.uid,
      name: input.displayName,
      email: input.email,
      preferredCurrency: input.preferredCurrency,
      createdAt: now,
      updatedAt: now,
    };

    const reference = await addDoc(collection(db, USERS_COLLECTION), data);

    return mapProfileDocument(reference.id, data, {
      uid: input.uid,
      email: input.email,
    });
  }
}
