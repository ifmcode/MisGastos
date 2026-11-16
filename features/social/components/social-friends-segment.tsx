import { FriendsList } from "@/features/friends/components/friends-list";
import type { Friend } from "@/features/friends/types/friend.types";

export interface SocialFriendsSegmentProps {
  friends: readonly Friend[];
  /** Id of the row with an operation in flight, if any. */
  pendingId: string | null;
  onRemove: (friend: Friend) => void;
}

/** "Tus amigos" segment: the existing friends list with its balances. */
export function SocialFriendsSegment({
  friends,
  pendingId,
  onRemove,
}: SocialFriendsSegmentProps) {
  return (
    <FriendsList
      friends={friends}
      pendingId={pendingId}
      onRemove={onRemove}
    />
  );
}
