import {
  allowOwnerLocalWrites,
  revokeOwnerLocalWrites,
} from "@/shared/lib/local-db/owner-revocation";

import { FirebaseAuthRepository } from "../repositories/firebase-auth.repository";
import { AuthService } from "./auth.service";
import type { AuthLocalSession } from "./auth.service";
import { EmailVerificationService } from "./email-verification.service";

let authServiceInstance: AuthService | null = null;
let emailVerificationServiceInstance: EmailVerificationService | null = null;

/**
 * Local-database side effects of the sign-out. `revoke` and `restore` are light
 * static imports; the purge is loaded on demand so the auth factory never pulls
 * Firestore (the sync engine) into the sign-in flow.
 */
const localSession: AuthLocalSession = {
  revoke: (ownerId) => revokeOwnerLocalWrites(ownerId),
  restore: (ownerId) => allowOwnerLocalWrites(ownerId),
  purge: async (ownerId) => {
    const { purgeLocalAccountOnLogout } = await import(
      "@/features/sync/services/account-local-data"
    );

    await purgeLocalAccountOnLogout(ownerId);
  },
};

export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    const repo = new FirebaseAuthRepository();
    authServiceInstance = new AuthService(repo, localSession);
  }
  return authServiceInstance;
}

export function getEmailVerificationService(): EmailVerificationService {
  if (!emailVerificationServiceInstance) {
    const repo = new FirebaseAuthRepository();
    emailVerificationServiceInstance = new EmailVerificationService(repo);
  }
  return emailVerificationServiceInstance;
}
