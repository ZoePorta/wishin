import {
  Client,
  Account,
  TablesDB,
  Query,
  AppwriteException,
  type Models,
} from "appwrite";
import type {
  WishlistRepository,
  UserRepository,
  Wishlist,
} from "@wishin/domain";
import { WishlistMapper } from "../mappers/wishlist.mapper";
import { WishlistItemMapper } from "../mappers/wishlist-item.mapper";
import { toDocument } from "../utils/to-document";
import type { SessionAwareRepository } from "./session-aware-repository.interface";

/**
 * Appwrite implementation of the WishlistRepository and UserRepository.
 */
export class AppwriteWishlistRepository
  implements WishlistRepository, UserRepository, SessionAwareRepository
{
  private readonly tablesDb: TablesDB;
  private readonly account: Account;

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
    this.account = new Account(this.client);
  }

  /**
   * Protected access for testing.
   */
  protected get accountAccess(): Account {
    return this.account;
  }

  /**
   * Protected access for testing.
   */
  protected get tablesDbAccess(): TablesDB {
    return this.tablesDb;
  }

  private ensureSessionInFlight: Promise<void> | null = null;
  private sessionEnsured = false;
  private _currentUser: Models.User<Models.Preferences> | null = null;

  /**
   * Ensures an active session exists.
   * Creates an anonymous session if no session is active.
   * // TODO: Replace with authenticated sessions once Phase 5 is implemented
   * @returns A Promise that resolves to the session/user object.
   * @throws {PersistenceError} If the session cannot be ensured.
   */
  async ensureSession(): Promise<Models.User<Models.Preferences>> {
    if (this.sessionEnsured && this._currentUser) {
      return this._currentUser;
    }

    if (this.ensureSessionInFlight) {
      await this.ensureSessionInFlight;
      if (this._currentUser) return this._currentUser;
    }

    this.ensureSessionInFlight = (async () => {
      try {
        this._currentUser = await this.account.get();
        this.sessionEnsured = true;
      } catch (error: unknown) {
        // More robust check for code 401 to handle monorepo instanceof issues
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === 401
        ) {
          try {
            await this.account.createAnonymousSession();
            this._currentUser = await this.account.get();
            this.sessionEnsured = true;
          } catch (sessionError: unknown) {
            console.error("Failed to create anonymous session");
            throw sessionError;
          }
        } else {
          throw error;
        }
      }
    })();

    try {
      await this.ensureSessionInFlight;
    } finally {
      this.ensureSessionInFlight = null;
    }

    if (!this._currentUser) {
      throw new Error("Session initialization failed: user is null");
    }

    return this._currentUser;
  }

  /**
   * Finds a wishlist by its unique ID.
   *
   * @param id - The wishlist UUID.
   * @param includeItems - Whether to fetch and include children items (default: true).
   * @returns A Promise that resolves to the Wishlist aggregate or null if not found.
   * @throws {PersistenceError} If the query fails or session cannot be ensured.
   */
  async findById(
    id: string,
    includeItems = true,
    shouldEnsureSession = true,
  ): Promise<Wishlist | null> {
    if (shouldEnsureSession) {
      await this.ensureSession();
    }
    try {
      // 1. Fetch Wishlist Document
      const wishlistDoc = await this.tablesDb.getRow({
        databaseId: this.databaseId,
        tableId: this.wishlistCollectionId,
        rowId: id,
      });

      // 2. Fetch Wishlist Items
      const itemDocuments: Models.Document[] = [];
      if (includeItems) {
        let itemsCursor: string | undefined = undefined;
        do {
          const queries = [Query.equal("wishlistId", id), Query.limit(100)];
          if (itemsCursor) {
            queries.push(Query.cursorAfter(itemsCursor));
          }
          const response = await this.tablesDb.listRows({
            databaseId: this.databaseId,
            tableId: this.wishlistItemsCollectionId,
            queries,
          });
          const docs = toDocument<Models.Document[]>(response.rows);
          itemDocuments.push(...docs);
          if (response.rows.length < 100) {
            itemsCursor = undefined;
          } else {
            itemsCursor = response.rows[response.rows.length - 1].$id;
          }
        } while (itemsCursor);
      }

      const items = itemDocuments.map((doc) =>
        WishlistItemMapper.toDomain(doc),
      );

      return WishlistMapper.toDomain(
        toDocument<Models.Document>(wishlistDoc),
        items,
      );
    } catch (error) {
      if (error instanceof AppwriteException && error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Finds all wishlists owned by a specific profile.
   *
   * @param ownerId - The owner's profile UUID.
   * @returns A Promise that resolves to an array of Wishlist aggregates.
   * @throws {PersistenceError} If the query fails or session cannot be ensured.
   */
  async findByOwnerId(ownerId: string): Promise<Wishlist[]> {
    await this.ensureSession();

    // 1. Fetch all Wishlist Documents by ownerId
    // Business Rule: Maximum 20 wishlists per owner (Post-MVP scaling limit)
    const response = await this.tablesDb.listRows({
      databaseId: this.databaseId,
      tableId: this.wishlistCollectionId,
      queries: [Query.equal("ownerId", ownerId), Query.limit(20)],
    });

    if (response.rows.length === 0) {
      return [];
    }

    const rows = toDocument<Models.Document[]>(response.rows);

    // 2. Map docs to aggregates by fetching details for each
    const wishlists = await Promise.all(
      rows.map((row) => this.findById(row.$id, false, false)),
    );

    // Filter out any nulls if findById could potentially return null
    return wishlists.filter((w): w is Wishlist => w !== null);
  }

  /**
   * Retrieves the current user's unique identifier.
   *
   * @returns A Promise that resolves to the current user ID.
   * @throws {PersistenceError} If the account cannot be retrieved.
   */
  async getCurrentUserId(): Promise<string> {
    const user = await this.ensureSession();
    return user.$id;
  }

  /**
   * Persists a wishlist aggregate with optimistic locking.
   *
   * @param wishlist - The wishlist aggregate to save.
   * @returns A Promise that resolves when the wishlist is saved.
   * @throws {PersistenceError} If the save operation fails, session cannot be ensured, or a concurrency conflict occurs.
   */
  async save(wishlist: Wishlist): Promise<void> {
    // 1. Ensure active session
    await this.ensureSession();

    // 2. Fetch current version for optimistic locking (ADR 022)
    // Double-check version immediately before write to prevent TOCTOU (ADR 023)
    try {
      const existingDoc = await this.tablesDb.getRow({
        databaseId: this.databaseId,
        tableId: this.wishlistCollectionId,
        rowId: wishlist.id,
      });

      const data = existingDoc as unknown as { version?: number };
      const currentVersion = data.version ?? 0;

      // Note: wishlist.version is the NEW version (incremented in domain)
      // So the expected version in DB should be wishlist.version - 1
      if (currentVersion !== wishlist.version - 1) {
        throw new Error(
          `Concurrency conflict (TOCTOU): Wishlist ${
            wishlist.id
          } version mismatch (DB: ${String(currentVersion)}, Expecting: ${String(
            wishlist.version - 1,
          )})`,
        );
      }
    } catch (error: unknown) {
      if (error instanceof AppwriteException && error.code === 404) {
        // If 404, it's a new wishlist, proceed with save (version should be 0)
        if (wishlist.version !== 0) {
          throw new Error(
            `Validation error (TOCTOU): New wishlist ${wishlist.id} must have version 0 (got ${String(wishlist.version)})`,
          );
        }
      } else {
        throw error;
      }
    }

    // 3. Sync Wishlist Items First (Atomicity step)
    // ... rest of the existing sync logic ...
    // 3a. Get existing items IDs to identify removals
    const existingItemIds: string[] = [];
    let existingCursor: string | undefined = undefined;
    do {
      const queries = [
        Query.equal("wishlistId", wishlist.id),
        Query.limit(100),
      ];
      if (existingCursor) {
        queries.push(Query.cursorAfter(existingCursor));
      }
      const response = await this.tablesDb.listRows({
        databaseId: this.databaseId,
        tableId: this.wishlistItemsCollectionId,
        queries,
      });
      existingItemIds.push(...response.rows.map((row) => row.$id));

      if (response.rows.length < 100) {
        existingCursor = undefined;
      } else {
        existingCursor = response.rows[response.rows.length - 1].$id;
      }
    } while (existingCursor);

    // 3b. Prepare upserts and deletes
    const currentItems = wishlist.items;
    const currentItemIds = new Set(currentItems.map((item) => item.id));
    const itemIdsToDelete = existingItemIds.filter(
      (id) => !currentItemIds.has(id),
    );

    // 3c. Execute sync with retry logic
    const MAX_RETRIES = 2;
    let attempt = 0;
    while (attempt <= MAX_RETRIES) {
      try {
        const upsertPromises = currentItems.map((item) =>
          this.tablesDb.upsertRow({
            databaseId: this.databaseId,
            tableId: this.wishlistItemsCollectionId,
            rowId: item.id,
            data: WishlistItemMapper.toPersistence(item),
          }),
        );

        const deletePromises = itemIdsToDelete.map(async (id) => {
          try {
            await this.tablesDb.deleteRow({
              databaseId: this.databaseId,
              tableId: this.wishlistItemsCollectionId,
              rowId: id,
            });
          } catch (error) {
            // Treat 404 (Not Found) as a success to ensure idempotency
            if (error instanceof AppwriteException && error.code === 404) {
              return;
            }
            throw error;
          }
        });

        await Promise.all([...upsertPromises, ...deletePromises]);
        break; // Success
      } catch (error) {
        attempt++;
        if (attempt > MAX_RETRIES) {
          console.error("Failed to sync wishlist items after retries:", error);
          throw error;
        }
        // Small backoff
        await new Promise((resolve) => setTimeout(resolve, attempt * 100));
      }
    }

    // 3. Upsert Wishlist Document AFTER successful items sync
    // (Version check already performed at step 2 to prevent TOCTOU)

    await this.tablesDb.upsertRow({
      databaseId: this.databaseId,
      tableId: this.wishlistCollectionId,
      rowId: wishlist.id,
      data: WishlistMapper.toPersistence(wishlist),
    });
  }

  /**
   * Deletes a wishlist and all its items (hard delete).
   *
   * @param id - The wishlist UUID.
   * @returns A Promise that resolves when the wishlist (and its items) is deleted.
   * @throws {PersistenceError} If the deletion fails or session cannot be ensured.
   */
  async delete(id: string): Promise<void> {
    await this.ensureSession();
    try {
      await this.tablesDb.deleteRow({
        databaseId: this.databaseId,
        tableId: this.wishlistCollectionId,
        rowId: id,
      });
    } catch (error) {
      if (error instanceof AppwriteException && error.code === 404) {
        return; // Already deleted
      }
      throw error;
    }
  }
}
