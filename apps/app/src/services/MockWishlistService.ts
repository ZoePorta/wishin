export interface WishlistItem {
  id: string;
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  url?: string;
  imageUrl?: string;
  priority: "low" | "medium" | "high";
  isReserved: boolean;
}

export interface Wishlist {
  id: string;
  title: string;
  description?: string;
  items: WishlistItem[];
}

const MOCK_WISHLIST: Wishlist = {
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

export const MockWishlistService = {
  getWishlistById: async (id: string): Promise<Wishlist | null> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (id === "test-wishlist-id") {
      return MOCK_WISHLIST;
    }
    return null;
  },
};
