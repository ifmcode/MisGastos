import { getAuthService } from "../services/auth.factory";
import { useMemo } from "react";

export function useAuthService() {
  const authService = useMemo(() => getAuthService(), []);
  return authService;
}
