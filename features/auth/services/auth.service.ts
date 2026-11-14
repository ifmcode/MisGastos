import { Email } from "../types/auth.types";
import { IAuthRepository } from "../repositories/auth.repository";
import { User } from "firebase/auth";
import {
  markPendingVerificationEmail,
  resetPendingVerificationEmail,
} from "../utils/verification-email-store";

export class AuthService {
  constructor(private authRepository: IAuthRepository) {}

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

  async logout(): Promise<void> {
    resetPendingVerificationEmail();
    return this.authRepository.signOut();
  }
}
