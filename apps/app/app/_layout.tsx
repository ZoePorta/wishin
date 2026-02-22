import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, StyleSheet, useColorScheme } from "react-native";
import { Colors } from "../src/constants/Colors";
import { WishlistRepositoryProvider } from "../src/contexts/WishlistRepositoryContext";
import {
  AppwriteWishlistRepository,
  createAppwriteClient,
} from "@wishin/infrastructure";
import { AppErrorBoundary } from "../src/components/AppErrorBoundary";
import { ConfigErrorScreen } from "../src/components/ConfigErrorScreen";
import { GeneralErrorScreen } from "../src/components/GeneralErrorScreen";
import { Config, ensureAppwriteConfig } from "../src/constants/Config";

// cached AppwriteWishlistRepository singleton
let cachedRepository: AppwriteWishlistRepository | null = null;

/**
 * Lazy singleton factory that creates and caches the AppwriteWishlistRepository.
 * This ensures that the Appwrite client and repository are only created once
 * and not during the render phase of any component.
 *
 * @returns {AppwriteWishlistRepository} The initialized Appwrite repository.
 * @throws {Error} if the Appwrite configuration is invalid or missing.
 */
function getAppwriteRepository(): AppwriteWishlistRepository {
  if (cachedRepository) {
    return cachedRepository;
  }

  ensureAppwriteConfig();

  const client = createAppwriteClient(
    Config.appwrite.endpoint,
    Config.appwrite.projectId,
  );

  cachedRepository = new AppwriteWishlistRepository(
    client,
    Config.appwrite.databaseId,
    Config.collections.wishlists,
    Config.collections.wishlistItems,
    Config.collections.transactions,
  );

  return cachedRepository;
}

/**
 * Root orchestrator component that manages dependencies.
 * This keeps the UI layout clean and focused on navigation.
 * Wrapped in a general AppErrorBoundary to catch any unexpected runtime errors.
 */
export default function Root() {
  return (
    <AppErrorBoundary fallback={<GeneralErrorScreen />}>
      <RootContent />
    </AppErrorBoundary>
  );
}

/**
 * Inner root component that narrows the boundary for configuration-related errors.
 */
function RootContent() {
  return (
    <AppErrorBoundary fallback={<ConfigErrorScreen />}>
      <AuthenticatedApp />
    </AppErrorBoundary>
  );
}

/**
 * Component that initializes the repository and provides it to the app.
 * This can throw if configuration is missing (via getAppwriteRepository).
 */
function AuthenticatedApp() {
  const repository = getAppwriteRepository();

  return (
    <WishlistRepositoryProvider repository={repository}>
      <RootLayout />
    </WishlistRepositoryProvider>
  );
}

/**
 * UI shell for the application including navigation and theme management.
 */
function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerTintColor: theme.text,
          headerShadowVisible: false,
          headerTitleStyle: {
            fontWeight: "bold",
          },
          contentStyle: {
            backgroundColor: theme.background,
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Welcome to Wishin" }} />
        <Stack.Screen name="wishlist/[id]" options={{ title: "Wishlist" }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
