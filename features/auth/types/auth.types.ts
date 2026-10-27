export type Email = `${string}@${string}.${string}`;

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  authProvider?: string;
}

export interface RegisterData {
  name: string;
  email: Email;
  password: string;
}
