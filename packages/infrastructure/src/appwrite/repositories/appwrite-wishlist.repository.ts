import {
  Client,
  Account,
  TablesDB,
  Query,
  AppwriteException,
  type Models,
} from "appwrite";
import {
  type WishlistRepository,
  PersistenceError,
  type UserRepository,
  type Logger,
  type ObservabilityService,
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
   * @param profileCollectionId - The ID of the profiles collection.
   * @param logger - Logger for technical/operational logs.
   * @param observability - Service for breadcrumbs and telemetry events.
   */
  constructor(
    private readonly client: Client,
    private readonly databaseId: string,
    private readonly wishlistCollectionId: string,
    private readonly wishlistItemsCollectionId: string,
    private readonly profileCollectionId: string,
    private readonly logger: Logger,
    private readonly observability: ObservabilityService,
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

  private resolveSessionInFlight: Promise<Models.User<Models.Preferences> | null> | null =
    null;
  private _currentUser: Models.User<Models.Preferences> | null = null;

  /**
   * Resolves the current session state.
   *
   * @returns A Promise that resolves to the user object if a session is active/created, or null otherwise.
   * @throws {PersistenceError} If the session resolution fails (e.g., network error).
   */
  async resolveSession(): Promise<Models.User<Models.Preferences> | null> {
    if (this.resolveSessionInFlight) {
      return this.resolveSessionInFlight;
    }

    this.resolveSessionInFlight = (async () => {
      try {
        this._currentUser = await this.account.get();
        return this._currentUser;
      } catch (error: unknown) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === 401
        ) {
          this._currentUser = null;
          return null;
        }
        throw new PersistenceError("Failed to get current account", {
          cause: error instanceof Error ? error : String(error),
        });
      } finally {
        this.resolveSessionInFlight = null;
      }
    })();

    return this.resolveSessionInFlight;
  }

  /**
   * Finds a wishlist by its unique ID.
   *
   * @param id - The wishlist UUID.
   * @param includeItems - Whether to fetch and include children items (default: true).
   * @returns A Promise that resolves to the Wishlist aggregate or null if not found.
   * @throws {PersistenceError} If the query fails or session cannot be ensured.
   */
  async findById(id: string, includeItems = true): Promise<Wishlist | null> {
    await this.resolveSession();
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
    await this.resolveSession();

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

    // 2. Map docs to aggregates by fetching details for each (using authenticated session)
    const wishlists = await Promise.all(
      rows.map((row) => this.findById(row.$id, false)),
    );

    // Filter out any nulls if findById could potentially return null
    return wishlists.filter((w): w is Wishlist => w !== null);
  }

  /**
   * Retrieves the current user's unique identifier.
   *
   * @returns A Promise that resolves to the current user ID, or null if no session is available.
   */
  async getCurrentUserId(): Promise<string | null> {
    const session = await this.resolveSession();
    return session?.$id ?? null;
  }

  /**
   * Determines the current session type to distinguish between guests and members.
   *
   * @returns A Promise that resolves to the session type:
   * - 'anonymous': Guest user with no registered account.
   * - 'incomplete': Registered account but missing profile record.
   * - 'registered': Fully registered user with a profile.
   * - null: If no session is active.
   * @throws {AppwriteException} For non-404 errors from Appwrite client calls (e.g., network or server errors).
   */
  async getSessionType(): Promise<
    "anonymous" | "incomplete" | "registered" | null
  > {
    const user = await this.resolveSession();

    if (!user) {
      return null;
    }

    if (!user.email) {
      return "anonymous";
    }

    // If it has email, it's a member. Check if they have a profile (ADR 026)
    try {
      // We use a query instead of findById to avoid unnecessary errors if possible,
      // but findById is already implemented with 404 handling in most repositories.
      // For AppwriteWishlistRepository, we'll need to use the profile repository if available
      // or implement the check directly on the profiles collection.
      await this.tablesDb.getRow({
        databaseId: this.databaseId,
        tableId: this.profileCollectionId,
        rowId: user.$id,
      });

      return "registered";
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === 404
      ) {
        return "incomplete";
      }
      throw error;
    }
  }

  /**
   * Persists a wishlist aggregate with optimistic locking.
   *
   * @param wishlist - The wishlist aggregate to save.
   * @returns A Promise that resolves when the wishlist is saved.
   * @throws {PersistenceError} If the save operation fails, session cannot be ensured, or a concurrency conflict occurs.
   */
  async save(wishlist: Wishlist): Promise<void> {
    // 1. Ensure active session (Must have identity to act)
    const user = await this.resolveSession();
    if (!user) {
      throw new PersistenceError("Unauthorized: No active session for saving");
    }

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
    // 3a. Get existing items for compensation backup
    const existingItems: Models.Document[] = [];
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
      existingItems.push(...toDocument<Models.Document[]>(response.rows));

      if (response.rows.length < 100) {
        existingCursor = undefined;
      } else {
        existingCursor = response.rows[response.rows.length - 1].$id;
      }
    } while (existingCursor);

    const existingItemIds = existingItems.map((row) => row.$id);

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
          this.logger.error("Failed to sync wishlist items after retries:", {
            wishlistId: wishlist.id,
            error: error instanceof Error ? error.message : String(error),
          });
          // COMPENSATION: Best-effort rollback of item changes even after retry failure
          const newItemIdsToDelete = Array.from(currentItemIds).filter(
            (id) => !existingItemIds.includes(id),
          );
          await this.compensateItemSyncTransitions(
            existingItems,
            newItemIdsToDelete,
            error instanceof Error ? error.message : String(error),
          );
          throw error;
        }
        // Small backoff
        await new Promise((resolve) => setTimeout(resolve, attempt * 100));
      }
    }

    // 3. Upsert Wishlist Document AFTER successful items sync
    // (Version check already performed at step 2 to prevent TOCTOU)
    try {
      await this.tablesDb.upsertRow({
        databaseId: this.databaseId,
        tableId: this.wishlistCollectionId,
        rowId: wishlist.id,
        data: WishlistMapper.toPersistence(wishlist),
      });
    } catch (saveError: unknown) {
      // 4. COMPENSATION: Best-effort rollback of item changes (ADR 023)
      const saveErrorMessage =
        saveError instanceof Error ? saveError.message : String(saveError);
      this.logger.error(
        `Wishlist ${wishlist.id} header save failed. Reverting item changes.`,
        { wishlistId: wishlist.id, error: saveErrorMessage },
      );

      const newItemIdsToDelete = Array.from(currentItemIds).filter(
        (id) => !existingItemIds.includes(id),
      );

      await this.compensateItemSyncTransitions(
        existingItems,
        newItemIdsToDelete,
        saveErrorMessage,
      );

      throw saveError;
    }
  }

  /**
   * Performs a compensating rollback for wishlist item changes.
   *
   * @param existingItems - The snapshot of item documents preserved before the operation.
   * @param newItemIdsToDelete - IDs of items that were newly created and should be removed.
   * @param originalErrorMessage - The error message that triggered this compensation.
   */
  private async compensateItemSyncTransitions(
    existingItems: Models.Document[],
    newItemIdsToDelete: string[],
    originalErrorMessage: string,
  ): Promise<void> {
    try {
      // 4a. Restore deleted/modified items
      const restorePromises = existingItems.map((oldItem) => {
        // Strip system fields before re-upserting
        const {
          $id,
          $tableId: _,
          $databaseId: __,
          $collectionId: ___,
          $permissions: ____,
          $createdAt: _____,
          $updatedAt: ______,
          $sequence: _______, // ADR 023: Omit Appwrite system field
          ...persistenceData
        } = oldItem as unknown as Record<string, unknown>;

        return this.tablesDb.upsertRow({
          databaseId: this.databaseId,
          tableId: this.wishlistItemsCollectionId,
          rowId: $id as string,
          data: persistenceData as Record<string, unknown>,
        });
      });

      // 4b. Delete newly created items
      const cleanupPromises = newItemIdsToDelete.map(async (id) => {
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

      const results = await Promise.allSettled([
        ...restorePromises,
        ...cleanupPromises,
      ]);

      // Detect and surface partial rollback failures
      const rejected = results.filter(
        (res): res is PromiseRejectedResult => res.status === "rejected",
      );
      if (rejected.length > 0) {
        const errorMsg = `CRITICAL: Compensation failed for ${String(
          rejected.length,
        )} operations during wishlist save rollback.`;
        const compensationErrorMessage = rejected
          .map((r) => String(r.reason))
          .join("; ");
        this.logger.error(errorMsg, { rejected });
        this.observability.trackEvent("compensation_failure", {
          failedCount: rejected.length,
          totalCount: results.length,
          originalErrorMessage,
          compensationErrorMessage,
        });
        throw new Error(`${errorMsg} Original error: ${originalErrorMessage}`);
      }
    } catch (compensationError: unknown) {
      const compensationErrorMessage =
        compensationError instanceof Error
          ? compensationError.message
          : String(compensationError);
      this.logger.error(
        "CRITICAL: Compensation logic failed to execute fully",
        {
          error: compensationErrorMessage,
          originalError: originalErrorMessage,
        },
      );
      this.observability.trackEvent("compensation_failed_exception", {
        reason: "exception_in_retry_loop",
        originalErrorMessage,
        compensationErrorMessage,
      });
      // Rethrow as a combined error to preserve context instead of swallowing
      throw new Error(
        `Save failure and compensation failure. Original: ${originalErrorMessage}, Compensation: ${compensationErrorMessage}`,
      );
    }
  }

  /**
   * Deletes a wishlist and all its items (hard delete).
   *
   * @param id - The wishlist UUID.
   * @returns A Promise that resolves when the wishlist (and its items) is deleted.
   * @throws {PersistenceError} If the deletion fails or session cannot be ensured.
   */
  async delete(id: string): Promise<void> {
    const session = await this.resolveSession();
    if (!session) {
      throw new PersistenceError(
        "Unauthorized: No active session for deleting",
      );
    }
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
