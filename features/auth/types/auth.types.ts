export type Email = `${string}@${string}.${string}`;

export type AuthFeedbackTone = "error" | "success";

export interface AuthFeedbackMessage {
  tone: AuthFeedbackTone;
  message: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  providerIds: string[];
  authProvider?: string;
}

export interface RegisterData {
  name: string;
  email: Email;
  password: string;
}
