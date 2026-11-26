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
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="social/add-friend" options={{ headerShown: false }} />
      <Stack.Screen name="social/requests" options={{ headerShown: false }} />
      <Stack.Screen
        name="social/friends/[uid]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="social/expenses/[expenseId]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="social/group-expenses/[expenseId]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="social/group-settlements/[settlementId]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="social/groups/[groupId]/index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="social/groups/[groupId]/settle"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="social/groups/join"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="social/settlements/new"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="social/settlements/[settlementId]"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="sync" options={{ headerShown: false }} />
      <Stack.Screen
        name="modal"
        options={{ presentation: "modal", title: t("stack.modal") }}
      />
    </Stack>
  );
}
