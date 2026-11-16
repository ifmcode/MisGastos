import { FriendsList } from "@/features/friends/components/friends-list";
import type { Friend } from "@/features/friends/types/friend.types";

export interface SocialFriendsSegmentProps {
  friends: readonly Friend[];
  onOpen: (friend: Friend) => void;
}

/** "Tus amigos" segment: the existing friends list with its balances. */
export function SocialFriendsSegment({
  friends,
  onOpen,
}: SocialFriendsSegmentProps) {
  return <FriendsList friends={friends} onOpen={onOpen} />;
}
