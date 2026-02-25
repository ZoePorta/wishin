import React, { useState, useEffect, type ReactNode } from "react";
import { View, ActivityIndicator } from "react-native";
import { WishlistRepositoryProvider } from "../contexts/WishlistRepositoryContext";
import { UserProvider } from "../contexts/UserContext";
import {
  AppwriteWishlistRepository,
  AppwriteTransactionRepository,
  createAppwriteClient,
  type SessionAwareRepository,
} from "@wishin/infrastructure";
import { Config, ensureAppwriteConfig } from "../constants/Config";

// cached instances for singleton pattern
let cachedWishlistRepository: AppwriteWishlistRepository | null = null;
let cachedTransactionRepository: AppwriteTransactionRepository | null = null;

function getRepositories() {
  if (cachedWishlistRepository && cachedTransactionRepository) {
    return {
      wishlistRepository: cachedWishlistRepository,
      transactionRepository: cachedTransactionRepository,
    };
  }

  ensureAppwriteConfig();

  const client = createAppwriteClient(
    Config.appwrite.endpoint,
    Config.appwrite.projectId,
  );

  cachedWishlistRepository = new AppwriteWishlistRepository(
    client,
    Config.appwrite.databaseId,
    Config.collections.wishlists,
    Config.collections.wishlistItems,
    Config.collections.transactions,
  );

  cachedTransactionRepository = new AppwriteTransactionRepository(
    client,
    Config.appwrite.databaseId,
    Config.collections.transactions,
  );

  return {
    wishlistRepository: cachedWishlistRepository,
    transactionRepository: cachedTransactionRepository,
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
export const CoreProvider: React.FC<CoreProviderProps> = ({
  children,
  onConfigError,
}) => {
  const [repositories, setRepositories] = useState<{
    wishlistRepository: AppwriteWishlistRepository;
    transactionRepository: AppwriteTransactionRepository;
  } | null>(null);

  useEffect(() => {
    try {
      const repos = getRepositories();
      const sessionAwareRepo =
        repos.wishlistRepository as unknown as SessionAwareRepository;

      sessionAwareRepo
        .ensureSession()
        .then(() => {
          setRepositories(repos);
        })
        .catch((error: unknown) => {
          console.error("Failed to establish session:", error);
          onConfigError(
            error instanceof Error ? error : new Error(String(error)),
          );
        });
    } catch (error) {
      onConfigError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [onConfigError]);

  if (!repositories) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <WishlistRepositoryProvider
      wishlistRepository={repositories.wishlistRepository}
      transactionRepository={repositories.transactionRepository}
    >
      <UserProvider>{children}</UserProvider>
    </WishlistRepositoryProvider>
  );
};
