import React, { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type {
  WishlistRepository,
  TransactionRepository,
  UserRepository,
  AuthRepository,
  ProfileRepository,
  Logger,
  ObservabilityService,
} from "@wishin/domain";

interface WishlistRepositoryContextProps {
  wishlistRepository: WishlistRepository;
  transactionRepository: TransactionRepository;
  userRepository: UserRepository;
  authRepository: AuthRepository;
  profileRepository: ProfileRepository;
  logger: Logger;
  observability: ObservabilityService;
}

const WishlistRepositoryContext = createContext<
  WishlistRepositoryContextProps | undefined
>(undefined);

/**
 * Provider component for the WishlistRepository and other core repositories.
 *
 * This provider initializes the repository context and makes it available
 * to the rest of the application. It uses {@link useRepositories} internally.
 *
 * @param props - The component props.
 * @param props.wishlistRepository - The {@link WishlistRepository} instance.
 * @param props.transactionRepository - The {@link TransactionRepository} instance.
 * @param props.userRepository - The {@link UserRepository} instance.
 * @param props.authRepository - The {@link AuthRepository} instance.
 * @param props.children - The child components to be wrapped by the provider.
 * @returns The React elements for the repository context provider.
 * @throws {Error} If `useRepositories` is called outside of this provider.
 */
export const WishlistRepositoryProvider: React.FC<{
  wishlistRepository: WishlistRepository;
  transactionRepository: TransactionRepository;
  userRepository: UserRepository;
  authRepository: AuthRepository;
  profileRepository: ProfileRepository;
  logger: Logger;
  observability: ObservabilityService;
  children: ReactNode;
}> = ({
  wishlistRepository,
  transactionRepository,
  userRepository,
  authRepository,
  profileRepository,
  logger,
  observability,
  children,
}) => {
  const value = useMemo(
    () => ({
      wishlistRepository,
      transactionRepository,
      userRepository,
      authRepository,
      profileRepository,
      logger,
      observability,
    }),
    [
      wishlistRepository,
      transactionRepository,
      userRepository,
      authRepository,
      profileRepository,
      logger,
      observability,
    ],
  );

  return (
    <WishlistRepositoryContext.Provider value={value}>
      {children}
    </WishlistRepositoryContext.Provider>
  );
};

/**
 * Hook to consume all repositories from the {@link WishlistRepositoryContext}.
 *
 * This hook provides access to all initialized repositories.
 *
 * @returns An object containing all repository instances.
 * @throws {Error} If the hook is used outside of a {@link WishlistRepositoryProvider}.
 */
export const useRepositories = (): WishlistRepositoryContextProps => {
  const context = useContext(WishlistRepositoryContext);
  if (!context) {
    throw new Error(
      "useRepositories must be used within a WishlistRepositoryProvider",
    );
  }
  return context;
};

/**
 * Hook to consume only the WishlistRepository from context (backwards compatibility).
 *
 * @returns The wishlist repository instance.
 * @throws {Error} If useRepositories fails (e.g. used outside of provider).
 */
export const useWishlistRepository = (): WishlistRepository => {
  return useRepositories().wishlistRepository;
};

/**
 * Hook to consume only the TransactionRepository from context.
 *
 * @returns The transaction repository instance.
 * @throws {Error} If useRepositories fails (e.g. used outside of provider).
 */
export const useTransactionRepository = (): TransactionRepository => {
  return useRepositories().transactionRepository;
};

/**
 * Hook to consume only the UserRepository from context.
 *
 * @returns The user repository instance.
 * @throws {Error} If useRepositories fails (e.g. used outside of provider).
 */
export const useUserRepository = (): UserRepository => {
  return useRepositories().userRepository;
};

/**
 * Hook to consume only the {@link AuthRepository} from context.
 *
 * @returns The auth repository instance.
 * @throws {Error} If {@link useRepositories} fails (e.g. used outside of provider).
 */
export const useAuthRepository = (): AuthRepository => {
  return useRepositories().authRepository;
};

/**
 * Hook to consume only the ProfileRepository from context.
 *
 * @returns The profile repository instance.
 * @throws {Error} If useRepositories fails (e.g. used outside of provider).
 */
export const useProfileRepository = (): ProfileRepository => {
  return useRepositories().profileRepository;
};

/**
 * Hook to consume only the Logger from context.
 *
 * @returns The logger instance.
 * @throws {Error} If useRepositories fails (e.g. used outside of provider).
 */
export const useLogger = (): Logger => {
  return useRepositories().logger;
};

/**
 * Hook to consume only the ObservabilityService from context.
 *
 * @returns The observability service instance.
 * @throws {Error} If useRepositories fails (e.g. used outside of provider).
 */
export const useObservability = (): ObservabilityService => {
  return useRepositories().observability;
};
