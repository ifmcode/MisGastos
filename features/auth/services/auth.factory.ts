import { AuthService } from "./auth.service";
import { FirebaseAuthRepository } from "../repositories/firebase-auth.repository";

let authServiceInstance: AuthService | null = null;

export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    const repo = new FirebaseAuthRepository();
    authServiceInstance = new AuthService(repo);
  }
  return authServiceInstance;
}
