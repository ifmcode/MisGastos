import { Email } from "../types/auth.types";
import { IAuthRepository } from "../repositories/auth.repository";
import { User } from "firebase/auth";
import {
  markPendingVerificationEmail,
  resetPendingVerificationEmail,
} from "../utils/verification-email-store";

/**
 * Local session side effects of the sign-out. `revoke` must run before the
 * Firebase session disappears, `restore` lifts the block when the sign-out
 * failed and `purge` only runs after it did.
 */
export type AuthLocalSession = {
  revoke: (ownerId: string) => void;
  restore: (ownerId: string) => void;
  purge: (ownerId: string) => Promise<void>;
};

export class AuthService {
  constructor(
    private authRepository: IAuthRepository,
    private localSession: AuthLocalSession = {
      revoke: () => undefined,
      restore: () => undefined,
      purge: async () => undefined,
    },
  ) {}

  async signInWithGoogle(): Promise<User | null> {
    return this.authRepository.signInWithGoogle();
  }

  async signInWithEmail(email: Email, password: string): Promise<User | null> {
    return this.authRepository.signInWithEmail(email, password);
  }

  async register(name: string, email: Email, password: string): Promise<User | null> {
    const user = await this.authRepository.registerWithEmail(
      name,
      email,
      password,
    );

    // The verification screen sends the first email so any rate-limit or
    // network failure is reported inline where the user can retry it.
    if (user) {
      markPendingVerificationEmail(user.uid);
    }

    return user;
  }

  async updateDisplayName(name: string): Promise<void> {
    return this.authRepository.updateDisplayName(name);
  }

  async resetPassword(email: Email): Promise<void> {
    return this.authRepository.sendPasswordReset(email);
  }

  /**
   * Clears the verification hint, blocks the owner's local writes while the
   * session still exists, signs out and only then purges the account's local
   * data. A failed sign-out keeps the session and lifts the block again, so the
   * account is not left unable to mirror or queue writes until the next login;
   * in that case nothing is purged and the error propagates.
   */
  async logout(): Promise<void> {
    resetPendingVerificationEmail();

    const ownerId = this.authRepository.getCurrentUserId();
    if (ownerId) this.localSession.revoke(ownerId);

    try {
      await this.authRepository.signOut();
    } catch (error) {
      if (ownerId) this.localSession.restore(ownerId);
      throw error;
    }

    if (ownerId) await this.localSession.purge(ownerId);
  }
}
