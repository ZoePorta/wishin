import React, { useState, useEffect, useMemo, type ReactNode } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { WishlistRepositoryProvider } from "../contexts/WishlistRepositoryContext";
import { UserProvider } from "../contexts/UserContext";
import {
  AppwriteWishlistRepository,
  AppwriteTransactionRepository,
  createAppwriteClient,
  type SessionAwareRepository,
} from "@wishin/infrastructure";
import { Config, ensureAppwriteConfig } from "../constants/Config";

/**
 * Factory function to create new repository instances.
 * This is now a pure function that does not maintain its own cache,
 * allowing the React component to manage the lifecycle.
 */
function createRepositories() {
  ensureAppwriteConfig();

  const client = createAppwriteClient(
    Config.appwrite.endpoint,
    Config.appwrite.projectId,
  );

  const wishlistRepository = new AppwriteWishlistRepository(
    client,
    Config.appwrite.databaseId,
    Config.collections.wishlists,
    Config.collections.wishlistItems,
    Config.collections.transactions,
  );

  const transactionRepository = new AppwriteTransactionRepository(
    client,
    Config.appwrite.databaseId,
    Config.collections.transactions,
  );

  return {
    wishlistRepository,
    transactionRepository,
  };
}

interface CoreProviderProps {
  children: ReactNode;
  onConfigError: (error: Error) => void;
}

/**
 * High-level provider that orchestrates infrastructure initialization.
 * Decouples the UI routing from the repository lifecycle.
 */
function isSessionAware(repo: unknown): repo is SessionAwareRepository {
  return (
    !!repo &&
    typeof (repo as SessionAwareRepository).ensureSession === "function"
  );
}

export const CoreProvider: React.FC<CoreProviderProps> = ({
  children,
  onConfigError,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);

  // useMemo ensures repositories are created once per mount/HMR cycle
  const repos = useMemo(() => createRepositories(), []);

  useEffect(() => {
    const init = async () => {
      try {
        const wishlistRepo = repos.wishlistRepository;

        if (!isSessionAware(wishlistRepo)) {
          throw new Error("Wishlist repository must be session aware");
        }

        // establish or restore session before allowing app entry
        await wishlistRepo.ensureSession();
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize core infrastructure:", error);
        onConfigError(
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    };

    void init();
  }, [onConfigError, repos]);

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <WishlistRepositoryProvider
      wishlistRepository={repos.wishlistRepository}
      transactionRepository={repos.transactionRepository}
      userRepository={repos.wishlistRepository}
    >
      <UserProvider>{children}</UserProvider>
    </WishlistRepositoryProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
