import React, { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { WishlistRepository } from "@wishin/domain";

interface WishlistRepositoryContextProps {
  repository: WishlistRepository;
}

const WishlistRepositoryContext = createContext<
  WishlistRepositoryContextProps | undefined
>(undefined);

/**
 * Provider component for the WishlistRepository.
 *
 * @param props - The component props.
 * @param props.repository - The repository instance to provide.
 * @param props.children - The child components.
 * @returns The React elements for the provider.
 */
export const WishlistRepositoryProvider: React.FC<{
  repository: WishlistRepository;
  children: ReactNode;
}> = ({ repository, children }) => {
  const value = useMemo(() => ({ repository }), [repository]);

  return (
    <WishlistRepositoryContext.Provider value={value}>
      {children}
    </WishlistRepositoryContext.Provider>
  );
};

/**
 * Hook to consume the WishlistRepository from context.
 *
 * @returns The repository interface.
 * @throws {Error} If the hook is used outside of a WishlistRepositoryProvider.
 */
export const useWishlistRepository = (): WishlistRepository => {
  const context = useContext(WishlistRepositoryContext);
  if (!context) {
    throw new Error(
      "useWishlistRepository must be used within a WishlistRepositoryProvider",
    );
  }
  return context.repository;
};
