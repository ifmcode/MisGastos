import { useMemo } from "react";

import { getEmailVerificationService } from "../services/auth.factory";

export function useEmailVerificationService() {
  return useMemo(() => getEmailVerificationService(), []);
}
