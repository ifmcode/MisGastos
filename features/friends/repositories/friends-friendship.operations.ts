import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import type { Friendship } from "../types/friend.types";
import { mapFriendshipDocument } from "./friends.mapper";

export const FRIENDSHIPS_COLLECTION = "friendships";

export async function getFriendshipOperation(
  friendshipId: string,
): Promise<Friendship | null> {
  const snapshot = await getDoc(doc(db, FRIENDSHIPS_COLLECTION, friendshipId));
  if (!snapshot.exists()) return null;

  return mapFriendshipDocument(
    snapshot.id,
    snapshot.data() as Record<string, unknown>,
  );
}

/** `array-contains` on the sorted members; no composite index needed. */
export async function getFriendshipsOperation(
  uid: string,
): Promise<Friendship[]> {
  const snapshot = await getDocs(
    query(
      collection(db, FRIENDSHIPS_COLLECTION),
      where("memberIds", "array-contains", uid),
    ),
  );

  const friendships: Friendship[] = [];

  for (const document of snapshot.docs) {
    const friendship = mapFriendshipDocument(
      document.id,
      document.data() as Record<string, unknown>,
    );
    if (friendship) friendships.push(friendship);
  }

  return friendships;
}

export async function deleteFriendshipOperation(
  friendshipId: string,
): Promise<void> {
  await deleteDoc(doc(db, FRIENDSHIPS_COLLECTION, friendshipId));
}
