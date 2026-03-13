import React, { useCallback, useState, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Text, Surface, ActivityIndicator, useTheme } from "react-native-paper";
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
  const theme = useTheme();
  const { sessionType, loading: userLoading, refetch } = useUser();
  const authRepo = useAuthRepository();
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(false);

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      setAuthLoading(true);
      try {
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
        await authRepo.register(email, password, _username);
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
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </Surface>
    );
  }

  if (sessionType === "registered") {
    return (
      <Surface style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyLarge" style={{ marginTop: 24 }}>
          Redirecting to your dashboard...
        </Text>
      </Surface>
    );
  }

  if (sessionType === "incomplete") {
    return (
      <Surface style={styles.container}>
        <View style={styles.centerContent}>
          <Text variant="headlineLarge" style={styles.title}>
            Almost there!
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Your registration is almost complete. Please wait for the profile
            setup feature.
          </Text>
        </View>
      </Surface>
    );
  }

  return (
    <Surface
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Text
          variant="displayLarge"
          style={[styles.brandTitle, { color: theme.colors.primary }]}
        >
          Wishin
        </Text>
        <Text
          variant="titleMedium"
          style={[
            styles.brandSubtitle,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          Share your wishes with the world
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
    marginBottom: 64,
  },
  brandTitle: {
    fontWeight: "900",
    letterSpacing: -1,
  },
  brandSubtitle: {
    marginTop: 8,
    textAlign: "center",
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "700",
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.8,
  },
});
