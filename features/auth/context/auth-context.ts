import { createContext } from "react";

import type { AuthUser } from "../types/auth.types";

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<AuthUser | null>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
