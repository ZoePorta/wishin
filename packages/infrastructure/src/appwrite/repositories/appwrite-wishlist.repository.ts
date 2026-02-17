import { Client, TablesDB, Query, type Models } from "appwrite";
import { type WishlistRepository, Wishlist } from "@wishin/domain";
import { WishlistMapper } from "../mappers/wishlist.mapper";
import { WishlistItemMapper } from "../mappers/wishlist-item.mapper";
import { toDocument } from "../utils/to-document";

/**
 * Appwrite implementation of the WishlistRepository.
 */
export class AppwriteWishlistRepository implements WishlistRepository {
  private readonly tablesDb: TablesDB;

  /**
   * Initializes the repository.
   *
   * @param client - The Appwrite Client SDK instance.
   * @param databaseId - The ID of the Appwrite database.
   * @param wishlistCollectionId - The ID of the wishlists collection.
   * @param wishlistItemsCollectionId - The ID of the wishlist items collection.
   */
  constructor(
    private readonly client: Client,
    private readonly databaseId: string,
    private readonly wishlistCollectionId: string,
    private readonly wishlistItemsCollectionId: string,
  ) {
    this.tablesDb = new TablesDB(this.client);
  }

  /**
   * Finds a wishlist by its unique identifier.
   *
   * @param id - The UUID of the wishlist.
   * @returns A Promise that resolves to the Wishlist aggregate or null if not found.
   */
  async findById(id: string): Promise<Wishlist | null> {
    try {
      // 1. Fetch Wishlist Document
      const wishlistDoc = await this.tablesDb.getRow({
        databaseId: this.databaseId,
        tableId: this.wishlistCollectionId,
        rowId: id,
      });

      // 2. Fetch Wishlist Items
      const itemsResponse = await this.tablesDb.listRows({
        databaseId: this.databaseId,
        tableId: this.wishlistItemsCollectionId,
        queries: [Query.equal("wishlistId", id)],
      });

      // 3. Map to Domain
      const items = toDocument<Models.Document[]>(itemsResponse.rows).map(
        (doc) => WishlistItemMapper.toDomain(doc),
      );

      return WishlistMapper.toDomain(
        toDocument<Models.Document>(wishlistDoc),
        items,
      );
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as Record<string, unknown>).code === 404
      ) {
        return null;
      }
      throw error;
    }
  }
}
