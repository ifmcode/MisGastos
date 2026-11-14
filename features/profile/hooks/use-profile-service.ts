import { useMemo } from "react";

import { getProfileService } from "../services/profile.factory";

export function useProfileService() {
  return useMemo(() => getProfileService(), []);
}
