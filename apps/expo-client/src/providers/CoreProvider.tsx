import React, { useState, useEffect, useMemo, type ReactNode } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { WishlistRepositoryProvider } from "../contexts/WishlistRepositoryContext";
import { UserProvider } from "../contexts/UserContext";
import {
  AppwriteWishlistRepository,
  AppwriteTransactionRepository,
  AppwriteAuthRepository,
  createAppwriteClient,
  type SessionAwareRepository,
} from "@wishin/infrastructure";
import { Config, ensureAppwriteConfig } from "../constants/Config";

/**
 * Adapter that maps console methods to the Logger interface.
 */
const consoleLogger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => {
    // eslint-disable-next-line no-console
    console.debug(msg, ctx);
  },
  info: (msg: string, ctx?: Record<string, unknown>) => {
    // eslint-disable-next-line no-console
    console.info(msg, ctx);
  },
  warn: (msg: string, ctx?: Record<string, unknown>) => {
    console.warn(msg, ctx);
  },
  error: (msg: string, ctx?: Record<string, unknown>) => {
    console.error(msg, ctx);
  },
};

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
    Config.collections.profiles,
    consoleLogger,
    {
      addBreadcrumb: (message, category, data) => {
        console.warn(`[Breadcrumb] ${category ?? "info"}: ${message}`, data);
      },
      trackEvent: (name, props) => {
        console.warn(`[Event] ${name}`, props);
      },
    }, // Simple Observability implementation using console for now
  );

  const transactionRepository = new AppwriteTransactionRepository(
    client,
    Config.appwrite.databaseId,
    Config.collections.transactions,
  );

  const authRepository = new AppwriteAuthRepository(
    client,
    Config.appwrite.endpoint,
    Config.appwrite.projectId,
    consoleLogger,
  );

  return {
    wishlistRepository,
    transactionRepository,
    authRepository,
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
  onConfigError: _onConfigError,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);

  // useMemo ensures repositories are created once per mount/HMR cycle
  const repos = useMemo(() => createRepositories(), []);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const sessionAwareRepo: SessionAwareRepository =
          repos.wishlistRepository;

        // timeout to prevent slow network from blocking startup (ADR 027)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => {
            reject(new Error("Session resolution timeout"));
          }, 5000),
        );

        // attempt to restore session without forcing creation

        await Promise.race([sessionAwareRepo.resolveSession(), timeoutPromise]);
      } catch (error) {
        // Log the error but do not block app initialization for transient session/network errors.
        // PersistenceError from resolveSession should not trigger onConfigError.
        console.error(
          "Transient session resolution error during initialization:",
          error,
        );
      } finally {
        if (isMounted) {
          setIsInitialized(true);
        }
      }
    };

    void init();

    return () => {
      isMounted = false;
    };
  }, [repos]);

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
      authRepository={repos.authRepository}
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
