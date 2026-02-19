import React, { createContext, useContext } from "react";
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
  return (
    <WishlistRepositoryContext.Provider value={{ repository }}>
      {children}
    </WishlistRepositoryContext.Provider>
  );
};

/**
 * Hook to consume the WishlistRepository from context.
 */
export const useWishlistRepository = () => {
  const context = useContext(WishlistRepositoryContext);
  if (!context) {
    throw new Error(
      "useWishlistRepository must be used within a WishlistRepositoryProvider",
    );
  }
  return context.repository;
};
