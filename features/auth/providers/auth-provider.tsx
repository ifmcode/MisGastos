import { onAuthStateChanged } from "firebase/auth";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";

import { auth } from "@/lib/firebase";
import { allowOwnerLocalWrites } from "@/shared/lib/local-db/owner-revocation";

import { AuthContext } from "../context/auth-context";
import type { AuthContextValue } from "../context/auth-context";
import { getEmailVerificationService } from "../services/auth.factory";
import type { AuthUser } from "../types/auth.types";
import { toAuthUser } from "../utils/auth-user";

export interface AuthProviderProps {
  children: ReactNode;
}

/** Keeps the authenticated user snapshot and exposes a manual refresh. */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      // A fresh session lifts the revocation left by the previous sign-out.
      if (firebaseUser) allowOwnerLocalWrites(firebaseUser.uid);

      setUser(toAuthUser(firebaseUser));
      setLoading(false);
    });
  }, []);

  const refreshUser = useCallback(async () => {
    const updated = await getEmailVerificationService().refreshStatus();
    setUser(updated);
    setLoading(false);
    return updated;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, refreshUser }),
    [user, loading, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
