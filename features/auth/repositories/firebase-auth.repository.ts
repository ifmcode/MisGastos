import { Email } from "../types/auth.types";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { IAuthRepository } from "./auth.repository";

const googleProvider = new GoogleAuthProvider();

export class FirebaseAuthRepository implements IAuthRepository {
  async signInWithGoogle(): Promise<User | null> {
    const res = await signInWithPopup(auth, googleProvider);
    const user = res.user;
    const q = query(collection(db, "users"), where("uid", "==", user.uid));
    const docs = await getDocs(q);
    if (docs.docs.length === 0) {
      await addDoc(collection(db, "users"), {
        uid: user.uid,
        name: user.displayName,
        authProvider: "google",
        email: user.email,
      });
    }
    return user;
  }

  async signInWithEmail(email: Email, password: string): Promise<User | null> {
    const res = await signInWithEmailAndPassword(auth, email, password);
    return res.user;
  }

  async registerWithEmail(name: string, email: Email, password: string): Promise<User | null> {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const user = res.user;
    await addDoc(collection(db, "users"), {
      uid: user.uid,
      name,
      authProvider: "local",
      email,
    });
    return user;
  }

  async sendPasswordReset(email: Email): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  async signOut(): Promise<void> {
    await signOut(auth);
  }
}
