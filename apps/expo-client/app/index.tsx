import React, { useCallback, useState, useEffect } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { Text, Surface } from "react-native-paper";
import { useRouter } from "expo-router";
import { useUser } from "../src/contexts/UserContext";
import { AuthPanel } from "../src/components/auth/AuthPanel";
import { useAuthRepository } from "../src/contexts/WishlistRepositoryContext";

/**
 * Root screen for the Expo client.
 * Orchestrates authentication and initial navigation.
 * Uses Material Design 3 components.
 *
 * @returns {JSX.Element} The root screen React element.
 */
export default function Index() {
  const { sessionType, loading: userLoading, refetch } = useUser();
  const authRepo = useAuthRepository();
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(false);

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      setAuthLoading(true);
      try {
        // We use the repo from context.
        await authRepo.login(email, password);
        await refetch();
      } finally {
        setAuthLoading(false);
      }
    },
    [authRepo, refetch],
  );

  const handleRegister = useCallback(
    async (email: string, password: string, _username: string) => {
      setAuthLoading(true);
      try {
        await authRepo.register(email, password);
        // Note: Full registration with profile creation is handled in RegisterUserUseCase.
        // For now, focusing on the Auth Panel UI as requested.
        await refetch();
      } finally {
        setAuthLoading(false);
      }
    },
    [authRepo, refetch],
  );

  // Redirection logic
  useEffect(() => {
    if (!userLoading && sessionType === "registered") {
      router.replace("/owner/dashboard");
    }
  }, [userLoading, sessionType, router]);

  if (userLoading) {
    return (
      <Surface style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </Surface>
    );
  }

  if (sessionType === "registered") {
    return (
      <Surface style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16 }}>Redirecting to your dashboard...</Text>
      </Surface>
    );
  }

  if (sessionType === "incomplete") {
    return (
      <Surface style={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Almost there!
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Your registration is almost complete. Please wait for the profile
          setup feature.
        </Text>
      </Surface>
    );
  }

  return (
    <Surface style={styles.container}>
      <View style={styles.header}>
        <Text variant="displayMedium" style={styles.brandTitle}>
          Wishin
        </Text>
        <Text variant="titleMedium" style={styles.brandSubtitle}>
          Share your wishes with the world.
        </Text>
      </View>

      <AuthPanel
        onLogin={handleLogin}
        onRegister={handleRegister}
        loading={authLoading}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  brandTitle: {
    fontWeight: "bold",
    color: "#6750A4", // MD3 Primary color roughly
  },
  brandSubtitle: {
    opacity: 0.7,
    marginTop: 8,
  },
  title: {
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.8,
  },
});
