import { Email } from "../types/auth.types";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { signInWithGoogle as requestGoogleSignIn } from "../services/google-signin.service";
import { IAuthRepository } from "./auth.repository";

interface UserProfile {
  name: string | null;
  authProvider: "google" | "local";
  email: string | null;
}

async function ensureUserProfile(
  user: User,
  profile: UserProfile,
): Promise<void> {
  const q = query(collection(db, "users"), where("uid", "==", user.uid));
  const docs = await getDocs(q);

  if (docs.docs.length > 0) {
    return;
  }

  await addDoc(collection(db, "users"), {
    uid: user.uid,
    ...profile,
  });
}

export class FirebaseAuthRepository implements IAuthRepository {
  async signInWithGoogle(): Promise<User | null> {
    const user = await requestGoogleSignIn();

    await ensureUserProfile(user, {
      name: user.displayName,
      authProvider: "google",
      email: user.email,
    });

    return user;
  }

  async signInWithEmail(email: Email, password: string): Promise<User | null> {
    const res = await signInWithEmailAndPassword(auth, email, password);

    // Repairs profiles created before the registration flow stored them.
    try {
      await ensureUserProfile(res.user, {
        name: res.user.displayName,
        authProvider: "local",
        email,
      });
    } catch {
      // The profile is retried on the next successful sign-in.
    }

    return res.user;
  }

  async registerWithEmail(name: string, email: Email, password: string): Promise<User | null> {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const user = res.user;

    try {
      await ensureUserProfile(user, {
        name,
        authProvider: "local",
        email,
      });
    } catch {
      // The auth account exists; the next email sign-in repairs the profile.
    }

    return user;
  }

  async sendVerificationEmail(): Promise<void> {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("No authenticated user to verify.");
    }

    await sendEmailVerification(user);
  }

  async reloadCurrentUser(): Promise<User | null> {
    const user = auth.currentUser;

    if (!user) {
      return null;
    }

    await user.reload();
    return auth.currentUser;
  }

  async sendPasswordReset(email: Email): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  async signOut(): Promise<void> {
    await signOut(auth);
  }
}
