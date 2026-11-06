import { AuthService } from "./auth.service";
import { EmailVerificationService } from "./email-verification.service";
import { FirebaseAuthRepository } from "../repositories/firebase-auth.repository";

let authServiceInstance: AuthService | null = null;
let emailVerificationServiceInstance: EmailVerificationService | null = null;

export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    const repo = new FirebaseAuthRepository();
    authServiceInstance = new AuthService(repo);
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
