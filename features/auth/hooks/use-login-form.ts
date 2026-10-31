import { useState } from "react";

import type { Email } from "@/shared/types/email.types";
import {
  logInWithEmailAndPassword,
  registerWithEmailAndPassword,
  signInWithGoogle,
} from "@/lib/auth";

export interface LoginForm {
  email: string;
  password: string;
  name: string;
  loading: boolean;
  isRegister: boolean;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setName: (name: string) => void;
  toggleMode: () => void;
  submit: () => Promise<void>;
  googleLogin: () => Promise<void>;
}

/** Owns the login/register fields and the three sign-in flows. */
export function useLoginForm(): LoginForm {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  async function submit() {
    if (isRegister) {
      if (!email || !password || !name) {
        alert("Por favor ingresa nombre, email y contraseña");
        return;
      }

      setLoading(true);
      await registerWithEmailAndPassword(name, email as Email, password);
      setLoading(false);
      return;
    }

    if (!email || !password) {
      alert("Por favor ingresa email y contraseña");
      return;
    }

    setLoading(true);
    await logInWithEmailAndPassword(email as Email, password);
    setLoading(false);
  }

  async function googleLogin() {
    setLoading(true);
    await signInWithGoogle();
    setLoading(false);
  }

  function toggleMode() {
    setIsRegister((current) => !current);
  }

  return {
    email,
    password,
    name,
    loading,
    isRegister,
    setEmail,
    setPassword,
    setName,
    toggleMode,
    submit,
    googleLogin,
  };
}
