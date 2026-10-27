import { Email } from "../types/auth.types";
import { IAuthRepository } from "../repositories/auth.repository";
import { User } from "firebase/auth";

export class AuthService {
  constructor(private authRepository: IAuthRepository) {}

  async signInWithGoogle(): Promise<User | null> {
    return this.authRepository.signInWithGoogle();
  }

  async signInWithEmail(email: Email, password: string): Promise<User | null> {
    return this.authRepository.signInWithEmail(email, password);
  }

  async register(name: string, email: Email, password: string): Promise<User | null> {
    return this.authRepository.registerWithEmail(name, email, password);
  }

  async resetPassword(email: Email): Promise<void> {
    return this.authRepository.sendPasswordReset(email);
  }

  async logout(): Promise<void> {
    return this.authRepository.signOut();
  }
}
