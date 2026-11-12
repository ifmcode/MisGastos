import { Stack, useRouter, useSegments, type Href } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/hooks/use-auth";

import { getAuthRedirect } from "../utils/auth-redirect";

/** Applies the auth and email-verification routing policy. */
export function AuthNavigator() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const { t } = useTranslation("navigation");

  useEffect(() => {
    if (loading) {
      return;
    }

    const target = getAuthRedirect({ user, segment: segments[0] });

    if (target) {
      router.replace(target as Href);
    }
  }, [user, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="verify-email" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="categories" options={{ headerShown: false }} />
      <Stack.Screen name="transfers" options={{ headerShown: false }} />
      <Stack.Screen
        name="modal"
        options={{ presentation: "modal", title: t("stack.modal") }}
      />
    </Stack>
  );
}
