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
