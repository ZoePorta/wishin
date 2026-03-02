import React, { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type {
  WishlistRepository,
  TransactionRepository,
  UserRepository,
} from "@wishin/domain";

interface WishlistRepositoryContextProps {
  wishlistRepository: WishlistRepository;
  transactionRepository: TransactionRepository;
  userRepository: UserRepository;
}

const WishlistRepositoryContext = createContext<
  WishlistRepositoryContextProps | undefined
>(undefined);

/**
 * Provider component for the WishlistRepository.
 *
 * @param props - The component props.
 * @param props.wishlistRepository - The wishlist repository instance.
 * @param props.transactionRepository - The transaction repository instance.
 * @param props.userRepository - The user repository instance.
 * @param props.children - The child components.
 * @returns The React elements for the provider.
 */
export const WishlistRepositoryProvider: React.FC<{
  wishlistRepository: WishlistRepository;
  transactionRepository: TransactionRepository;
  userRepository: UserRepository;
  children: ReactNode;
}> = ({
  wishlistRepository,
  transactionRepository,
  userRepository,
  children,
}) => {
  const value = useMemo(
    () => ({ wishlistRepository, transactionRepository, userRepository }),
    [wishlistRepository, transactionRepository, userRepository],
  );

  return (
    <WishlistRepositoryContext.Provider value={value}>
      {children}
    </WishlistRepositoryContext.Provider>
  );
};

/**
 * Hook to consume the repositories from context.
 *
 * @returns The repository interfaces.
 * @throws {Error} If the hook is used outside of a WishlistRepositoryProvider.
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
