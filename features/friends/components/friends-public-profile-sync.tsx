import { useFriendsProfileSync } from "../hooks/use-friends-profile-sync";

/** Renders nothing; keeps the public profile of the signed-in user in sync. */
export function FriendsPublicProfileSync(): null {
  useFriendsProfileSync();

  return null;
}
