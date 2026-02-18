import {
  Client,
  TablesDB,
  Query,
  type Models,
  RelationshipType,
  RelationMutate,
} from "node-appwrite";
import "dotenv/config";

const {
  EXPO_PUBLIC_APPWRITE_ENDPOINT,
  EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  APPWRITE_API_SECRET,
  EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  EXPO_PUBLIC_DB_PREFIX,
  CLEANUP,
} = process.env;

if (
  !EXPO_PUBLIC_APPWRITE_ENDPOINT ||
  !EXPO_PUBLIC_APPWRITE_PROJECT_ID ||
  !APPWRITE_API_SECRET ||
  !EXPO_PUBLIC_APPWRITE_DATABASE_ID
) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

// Type-safe environment variables
const endpoint = EXPO_PUBLIC_APPWRITE_ENDPOINT;
const projectId = EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = APPWRITE_API_SECRET;
const databaseId = EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const prefix = EXPO_PUBLIC_DB_PREFIX ?? "";
const isCleanupEnabled = CLEANUP === "true";

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const tablesDb = new TablesDB(client);

/**
 * Base properties for all attribute types.
 */
interface BaseAttribute {
  key: string;
  required: boolean;
  array?: boolean;
}

/**
 * Properties for string attributes.
 */
interface StringAttribute extends BaseAttribute {
  type: "string";
  size: number;
  default?: string;
}

/**
 * Properties for integer attributes.
 */
interface IntegerAttribute extends BaseAttribute {
  type: "integer";
  default?: number;
}

/**
 * Properties for boolean attributes.
 */
interface BooleanAttribute extends BaseAttribute {
  type: "boolean";
  default?: boolean;
}

/**
 * Properties for double (float) attributes.
 */
interface DoubleAttribute extends BaseAttribute {
  type: "double";
  default?: number;
}

/**
 * Properties for datetime attributes.
 */
interface DatetimeAttribute extends BaseAttribute {
  type: "datetime";
  default?: string;
}

/**
 * Properties for relationship attributes.
 */
interface RelationshipAttribute {
  type: "relationship";
  relatedCollectionId: string;
  relationshipType: RelationshipType;
  twoWay?: boolean;
  key?: string;
  twoWayKey?: string;
  onDelete?: RelationMutate;
}

/**
 * Union type of all supported attribute definitions.
 */
type Attribute =
  | StringAttribute
  | IntegerAttribute
  | BooleanAttribute
  | DoubleAttribute
  | DatetimeAttribute
  | RelationshipAttribute;

/**
 * Represents the schema definition for an Appwrite collection (table).
 */
interface CollectionSchema {
  id: string;
  name: string;
  attributes: Attribute[];
}

/**
 * Type guard to check if an error is an AppwriteException.
 *
 * @param err - The error to check.
 * @returns True if the error matches the Appwrite exception structure.
 */
function isAppwriteError(
  err: unknown,
): err is { code: number; message: string } {
  return typeof err === "object" && err !== null && "code" in err;
}

/**
 * The infrastructure schema definition for the Wishin project.
 * Defines collections and their attributes for Users, Wishlists, Items, and Transactions.
 */
const schema: CollectionSchema[] = [
  {
    id: "users",
    name: "Users",
    attributes: [
      { key: "email", type: "string", required: true, size: 255 },
      { key: "username", type: "string", required: true, size: 30 },
      { key: "imageUrl", type: "string", required: false, size: 2048 },
      { key: "bio", type: "string", required: false, size: 500 },
    ],
  },
  {
    id: "wishlists",
    name: "Wishlists",
    attributes: [
      {
        type: "relationship",
        relatedCollectionId: "users",
        relationshipType: RelationshipType.ManyToOne,
        key: "ownerId",
        onDelete: RelationMutate.Cascade,
      },
      { key: "title", type: "string", required: true, size: 100 },
      { key: "description", type: "string", required: false, size: 500 },
      { key: "visibility", type: "string", required: true, size: 20 },
      { key: "participation", type: "string", required: true, size: 20 },
    ],
  },
  {
    id: "wishlist_items",
    name: "Wishlist Items",
    attributes: [
      {
        type: "relationship",
        relatedCollectionId: "wishlists",
        relationshipType: RelationshipType.ManyToOne,
        key: "wishlistId",
        onDelete: RelationMutate.Cascade,
      },
      { key: "name", type: "string", required: true, size: 100 },
      { key: "description", type: "string", required: false, size: 500 },
      { key: "priority", type: "integer", required: true },
      { key: "price", type: "double", required: false },
      { key: "currency", type: "string", required: false, size: 3 },
      { key: "url", type: "string", required: false, size: 2048 },
      { key: "imageUrl", type: "string", required: false, size: 2048 },
      { key: "isUnlimited", type: "boolean", required: false, default: false },
      { key: "totalQuantity", type: "integer", required: false, default: 1 },
    ],
  },
  {
    id: "transactions",
    name: "Transactions",
    attributes: [
      {
        type: "relationship",
        relatedCollectionId: "wishlist_items",
        relationshipType: RelationshipType.ManyToOne,
        key: "itemId",
        onDelete: RelationMutate.Cascade,
      },
      {
        type: "relationship",
        relatedCollectionId: "users",
        relationshipType: RelationshipType.ManyToOne,
        key: "userId",
        onDelete: RelationMutate.Cascade,
      },
      { key: "guestSessionId", type: "string", required: false, size: 255 },
      { key: "status", type: "string", required: true, size: 20 },
      { key: "quantity", type: "integer", required: false, default: 1 },
    ],
  },
];

/**
 * Performs cleanup of environment-specific collections.
 * Deletes all collections matching the configured prefix if CLEANUP is enabled.
 *
 * @throws {Error} If cleanup fails for reasons other than 404.
 */
async function cleanup() {
  if (!isCleanupEnabled) return;
  if (!prefix) {
    console.warn(
      "CLEANUP=true but EXPO_PUBLIC_DB_PREFIX is empty. Skipping cleanup for safety.",
    );
    return;
  }

  console.log(`Cleaning up collections with prefix "${prefix}_"...`);
  try {
    let cursor: string | undefined = undefined;
    do {
      const result: Models.TableList = await tablesDb.listTables({
        databaseId,
        queries: [
          Query.limit(100),
          ...(cursor ? [Query.cursorAfter(cursor)] : []),
        ],
      });

      for (const table of result.tables) {
        if (table.$id.startsWith(`${prefix}_`)) {
          console.log(`Deleting collection "${table.name}" (${table.$id})...`);
          await tablesDb.deleteTable({
            databaseId,
            tableId: table.$id,
          });
        }
      }

      cursor =
        result.tables.length > 0
          ? result.tables[result.tables.length - 1].$id
          : undefined;

      // If we got fewer results than the limit, we've reached the end
      if (result.tables.length < 100) {
        cursor = undefined;
      }
    } while (cursor);
  } catch (error: unknown) {
    if (isAppwriteError(error) && error.code === 404) {
      console.log(`Database "${databaseId}" not found. Skipping cleanup.`);
      return;
    }
    console.error("Cleanup failed:", error);
    process.exit(1);
  }
}

/**
 * Main provisioning function.
 * Ensures the database exists, creates collections, and sets up all required attributes.
 * This function is idempotent and can be run multiple times safely.
 *
 * @throws {Error} If provisioning fails.
 */
async function provision() {
  try {
    // 0. Cleanup
    await cleanup();

    // 1. Database
    try {
      await tablesDb.get({ databaseId });
      console.log(`Database "${databaseId}" already exists.`);
    } catch (error: unknown) {
      if (isAppwriteError(error) && error.code === 404) {
        await tablesDb.create({ databaseId, name: databaseId });
        console.log(`Database "${databaseId}" created.`);
      } else {
        throw error;
      }
    }

    // 2. Collections (Create all first)
    // We need to create all collections first so we can link them with relationships
    for (const coll of schema) {
      const collectionId = prefix ? `${prefix}_${coll.id}` : coll.id;
      try {
        await tablesDb.getTable({
          databaseId,
          tableId: collectionId,
        });
        console.log(
          `Collection "${coll.name}" (${collectionId}) already exists.`,
        );
      } catch (error: unknown) {
        if (isAppwriteError(error) && error.code === 404) {
          await tablesDb.createTable({
            databaseId,
            tableId: collectionId,
            name: coll.name,
            permissions: ['read("any")'],
            enabled: true,
            rowSecurity: true,
          });
          console.log(`Collection "${coll.name}" (${collectionId}) created.`);
        } else {
          throw error;
        }
      }
    }

    // 3. Attributes (and Relationships)
    for (const coll of schema) {
      const collectionId = prefix ? `${prefix}_${coll.id}` : coll.id;
      const collection = await tablesDb.getTable({
        databaseId,
        tableId: collectionId,
      });

      const existingAttributes = (collection.columns as { key: string }[]).map(
        (a) => a.key,
      );

      for (const attr of coll.attributes) {
        // Handle Relationships
        if (attr.type === "relationship") {
          const relatedCollectionId = prefix
            ? `${prefix}_${attr.relatedCollectionId}`
            : attr.relatedCollectionId;

          // Check if relationship exists (this is a bit tricky as key might not be directly exposed in simple list if not expanded, but columns usually show it)
          // For now, simple check like other attributes:
          if (attr.key && existingAttributes.includes(attr.key)) {
            continue;
          }

          console.log(
            `Creating relationship "${attr.key ?? "unknown"}" in "${collectionId}" linking to "${relatedCollectionId}"...`,
          );
          await tablesDb.createRelationshipColumn({
            databaseId,
            tableId: collectionId,
            relatedTableId: relatedCollectionId,
            type: attr.relationshipType,
            twoWay: attr.twoWay,
            key: attr.key,
            twoWayKey: attr.twoWayKey,
            onDelete: attr.onDelete,
          });

          if (attr.key) {
            await waitForAttribute(
              tablesDb,
              databaseId,
              collectionId,
              attr.key,
            );
          }
          continue;
        }

        if (existingAttributes.includes(attr.key)) {
          // console.log(`Attribute "${attr.key}" in "${collectionId}" already exists.`);
          continue;
        }

        console.log(`Creating attribute "${attr.key}" in "${collectionId}"...`);
        switch (attr.type) {
          case "string":
            await tablesDb.createVarcharColumn({
              databaseId,
              tableId: collectionId,
              key: attr.key,
              size: attr.size,
              required: attr.required,
              xdefault: attr.default,
            });
            break;
          case "integer":
            await tablesDb.createIntegerColumn({
              databaseId,
              tableId: collectionId,
              key: attr.key,
              required: attr.required,
              xdefault: attr.default,
            });
            break;
          case "boolean":
            await tablesDb.createBooleanColumn({
              databaseId,
              tableId: collectionId,
              key: attr.key,
              required: attr.required,
              xdefault: attr.default,
            });
            break;
          case "double":
            await tablesDb.createFloatColumn({
              databaseId,
              tableId: collectionId,
              key: attr.key,
              required: attr.required,
              xdefault: attr.default,
            });
            break;
          case "datetime":
            await tablesDb.createDatetimeColumn({
              databaseId,
              tableId: collectionId,
              key: attr.key,
              required: attr.required,
              xdefault: attr.default,
            });
            break;
        }

        // Wait for attribute to be ready
        await waitForAttribute(tablesDb, databaseId, collectionId, attr.key);
      }
    }

    console.log("Provisioning completed successfully.");
  } catch (error: unknown) {
    console.error("Provisioning failed:", error);
    process.exit(1);
  }
}

void provision();

async function waitForAttribute(
  tablesDb: TablesDB,
  databaseId: string,
  collectionId: string,
  key: string,
) {
  console.log(`Waiting for attribute "${key}" to be ready...`);
  let isReady = false;
  let attempts = 0;
  // Wait up to 10 seconds (20 attempts * 500ms)
  while (!isReady && attempts < 20) {
    try {
      const table = await tablesDb.getTable({
        databaseId,
        tableId: collectionId,
      });
      const column = (table.columns as { key: string; status: string }[]).find(
        (c) => c.key === key,
      );
      if (column?.status === "available") {
        isReady = true;
      }
    } catch (_e) {
      // ignore errors during poll
    }

    if (!isReady) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      attempts++;
    }
  }

  if (!isReady) {
    throw new Error(`Attribute "${key}" failed to become available.`);
  }
}
