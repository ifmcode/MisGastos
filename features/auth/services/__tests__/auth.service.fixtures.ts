import { jest } from "@jest/globals";

import type { Email } from "../../types/auth.types";
import type { IAuthRepository } from "../../repositories/auth.repository";

export const email = "user@example.com" as Email;

/** Repository stub: every method is a spy, `getCurrentUserId` has no session. */
export function createRepository(): IAuthRepository {
  return {
    signInWithGoogle: jest.fn(async () => null),
    signInWithEmail: jest.fn(async () => null),
    registerWithEmail: jest.fn(async () => null),
    updateDisplayName: jest.fn(async () => undefined),
    sendPasswordReset: jest.fn(async () => undefined),
    sendVerificationEmail: jest.fn(async () => undefined),
    reloadCurrentUser: jest.fn(async () => null),
    signOut: jest.fn(async () => undefined),
    getCurrentUserId: jest.fn(() => null),
  };
}

/** Local session spy that appends its call to `calls`, for ordering checks. */
export function createLocalSession(calls: string[] = []) {
  return {
    revoke: jest.fn((ownerId: string) => {
      calls.push(`revoke:${ownerId}`);
    }),
    restore: jest.fn((ownerId: string) => {
      calls.push(`restore:${ownerId}`);
    }),
    purge: jest.fn(async (ownerId: string) => {
      calls.push(`purge:${ownerId}`);
    }),
  };
}
