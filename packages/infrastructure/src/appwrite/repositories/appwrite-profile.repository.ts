import { Client, TablesDB, AppwriteException, type Models } from "appwrite";
import type { ProfileRepository, Profile } from "@wishin/domain";
import { ProfileMapper } from "../mappers/profile.mapper";
import { toDocument } from "../utils/to-document";

/**
 * Appwrite implementation of the ProfileRepository.
 */
export class AppwriteProfileRepository implements ProfileRepository {
  private readonly tablesDb: TablesDB;

  /**
   * Initializes the repository.
   *
   * @param client - The Appwrite Client SDK instance.
   * @param databaseId - The ID of the Appwrite database.
   * @param collectionId - The ID of the profiles collection.
   */
  constructor(
    private readonly client: Client,
    private readonly databaseId: string,
    private readonly collectionId: string,
  ) {
    this.tablesDb = new TablesDB(this.client);
  }

  /**
   * Finds a profile by its unique user ID.
   *
   * @param id - The user UUID.
   * @returns A Promise that resolves to the Profile entity or null if not found.
   * @throws {AppwriteException} For non-404 Appwrite SDK errors.
   * @throws {Error} For other unexpected errors, including mapping failures.
   */
  async findById(id: string): Promise<Profile | null> {
    try {
      const doc = await this.tablesDb.getRow({
        databaseId: this.databaseId,
        tableId: this.collectionId,
        rowId: id,
      });

      return ProfileMapper.toDomain(toDocument<Models.Document>(doc));
    } catch (error) {
      if (error instanceof AppwriteException && error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Persists a profile entity.
   *
   * @param profile - The profile entity to save.
   * @returns A Promise that resolves when the profile is saved.
   * @throws {AppwriteException} For Appwrite SDK failures.
   * @throws {Error} For other unexpected errors.
   */
  async save(profile: Profile): Promise<void> {
    await this.tablesDb.upsertRow({
      databaseId: this.databaseId,
      tableId: this.collectionId,
      rowId: profile.id,
      data: ProfileMapper.toPersistence(profile),
    });
  }
}
