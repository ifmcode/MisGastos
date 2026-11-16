import { AddFriendScreen } from "@/features/social/components/add-friend-screen";
import { notifyRequestsRefresh } from "@/features/social/utils/requests-refresh-store";

export default function AddFriendRoute() {
  return <AddFriendScreen onRequestSent={notifyRequestsRefresh} />;
}
