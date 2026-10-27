import { User } from "firebase/auth";
import { Email } from "../types/auth.types";

export interface IAuthRepository {
  signInWithGoogle(): Promise<User | null>;
  signInWithEmail(email: Email, password: string): Promise<User | null>;
  registerWithEmail(name: string, email: Email, password: string): Promise<User | null>;
  sendPasswordReset(email: Email): Promise<void>;
  signOut(): Promise<void>;
}
