import { Email } from "@/common/types";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  logInWithEmailAndPassword,
  registerWithEmailAndPassword,
  signInWithGoogle,
} from "@/lib/auth";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
} from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      alert("Por favor ingresa email y contraseña");
      return;
    }
    setLoading(true);
    await logInWithEmailAndPassword(email as Email, password);
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!email || !password || !name) {
      alert("Por favor ingresa nombre, email y contraseña");
      return;
    }
    setLoading(true);
    await registerWithEmailAndPassword(name, email as Email, password);
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await signInWithGoogle();
    setLoading(false);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        MisGastos
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        {isRegister ? "Crea una cuenta" : "Inicia sesión para continuar"}
      </ThemedText>

      {isRegister && (
        <TextInput
          style={styles.input}
          placeholder="Nombre"
          placeholderTextColor="#999"
          autoCapitalize="words"
          value={name}
          onChangeText={setName}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable
        style={[styles.button, styles.emailButton]}
        onPress={isRegister ? handleRegister : handleEmailLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.buttonText}>
            {isRegister ? "Registrarse" : "Iniciar sesión con Email"}
          </ThemedText>
        )}
      </Pressable>

      {!isRegister && (
        <Pressable
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>
            Iniciar sesión con Google
          </ThemedText>
        </Pressable>
      )}

      <Pressable
        style={styles.toggleButton}
        onPress={() => setIsRegister(!isRegister)}
      >
        <ThemedText style={styles.toggleText}>
          {isRegister
            ? "¿Ya tienes cuenta? Inicia sesión"
            : "¿No tienes cuenta? Regístrate"}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 32,
    opacity: 0.7,
  },
  input: {
    width: "100%",
    maxWidth: 340,
    height: 48,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
  },
  button: {
    width: "100%",
    maxWidth: 340,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  emailButton: {
    backgroundColor: "#0a7ea4",
  },
  googleButton: {
    backgroundColor: "#db4437",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  toggleButton: {
    marginTop: 24,
  },
  toggleText: {
    color: "#0a7ea4",
    fontSize: 14,
  },
});
