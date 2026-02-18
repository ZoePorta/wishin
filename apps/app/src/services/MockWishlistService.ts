/**
 * Represents a single item in a wishlist.
 *
 * @remarks
 * This interface intentionally duplicates `WishlistItemOutput` from `@wishin/domain`
 * to avoid a direct dependency on the domain layer in the app package for now.
 * See: packages/domain/src/use-cases/dtos/get-wishlist.dto.ts
 */
export interface WishlistItem {
  /** Unique identifier for the item. */
  id: string;
  /** Title of the item. */
  title: string;
  /** Optional description of the item. */
  description?: string;
  /** Price of the item. */
  price?: number;
  /** Currency code (e.g., USD). */
  currency?: string;
  /** URL to the item online. */
  url?: string;
  /** URL of the item's image. */
  imageUrl?: string;
  /** Priority level of the item. */
  priority: "low" | "medium" | "high";
  /** Whether the item is reserved. */
  isReserved: boolean;
}

/**
 * Represents a wishlist containing multiple items.
 *
 * @remarks
 * This interface intentionally duplicates `WishlistOutput` from `@wishin/domain`
 * to avoid a direct dependency on the domain layer in the app package for now.
 * See: packages/domain/src/use-cases/dtos/get-wishlist.dto.ts
 */
export interface Wishlist {
  /** Unique identifier for the wishlist. */
  id: string;
  /** Title of the wishlist. */
  title: string;
  /** Optional description of the wishlist. */
  description?: string;
  /** List of items in the wishlist. */
  items: WishlistItem[];
}

const MOCK_WISHLIST: Readonly<Wishlist> = {
  id: "test-wishlist-id",
  title: "My Birthday Wishlist",
  description: "Things I would love to receive for my birthday! 🎉",
  items: [
    {
      id: "item-1",
      title: "Noise Cancelling Headphones",
      description: "Sony WH-1000XM5, preferably in black.",
      price: 348.0,
      currency: "USD",
      url: "https://example.com/headphones",
      imageUrl:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8aGVhZHBob25lc3xlbnwwfHwwfHx8MA%3D%3D",
      priority: "high",
      isReserved: false,
    },
    {
      id: "item-2",
      title: "Mechanical Keyboard",
      description: "Keychron K2 Pro with brown switches.",
      price: 99.0,
      currency: "USD",
      url: "https://example.com/keyboard",
      priority: "medium",
      isReserved: true,
    },
    {
      id: "item-3",
      title: "The Pragmatic Programmer",
      description: "20th Anniversary Edition book.",
      price: 45.0,
      currency: "USD",
      url: "https://example.com/book",
      imageUrl:
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGJvb2t8ZW58MHx8MHx8fDA%3D",
      priority: "low",
      isReserved: false,
    },
  ],
};

/**
 * Service to provide mock wishlist data for development and testing.
 */
export const MockWishlistService = {
  /**
   * Retrieves a wishlist by its ID.
   *
   * @param id - The unique identifier of the wishlist to retrieve.
   * @returns A promise that resolves to the Wishlist object if found, or null if not found.
   */
  getWishlistById: async (id: string): Promise<Wishlist | null> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (id === MOCK_WISHLIST.id) {
      // Shallow clone items (sufficient for current primitive-only WishlistItem shape)
      const clonedItems = MOCK_WISHLIST.items.map((item) => ({ ...item }));
      return { ...MOCK_WISHLIST, items: clonedItems };
    }
    return null;
  },
};
