import type { IEmailVerificationRepository } from "../repositories/auth.repository";
import type { AuthUser } from "../types/auth.types";
import { toAuthUser } from "../utils/auth-user";
import { needsEmailVerification } from "../utils/email-verification";

export type VerificationRequestResult = "sent" | "skipped";

export class EmailVerificationService {
  constructor(private repository: IEmailVerificationRepository) {}

  /**
   * Requests a verification email only for email/password accounts that still
   * need it. Google accounts and verified accounts are a no-op.
   */
  async requestEmail(user: AuthUser | null): Promise<VerificationRequestResult> {
    if (!needsEmailVerification(user)) {
      return "skipped";
    }

    await this.repository.sendVerificationEmail();
    return "sent";
  }

  /** Reloads the Firebase user and returns the updated app snapshot. */
  async refreshStatus(): Promise<AuthUser | null> {
    const user = await this.repository.reloadCurrentUser();
    return toAuthUser(user);
  }
}
