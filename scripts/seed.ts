import { Client, TablesDB, ID } from "node-appwrite";
import "dotenv/config";

const {
  EXPO_PUBLIC_APPWRITE_ENDPOINT,
  EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  APPWRITE_API_SECRET,
  EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  EXPO_PUBLIC_DB_PREFIX,
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

const endpoint = EXPO_PUBLIC_APPWRITE_ENDPOINT;
const projectId = EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = APPWRITE_API_SECRET;
const databaseId = EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const prefix = EXPO_PUBLIC_DB_PREFIX ?? "";

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const tablesDb = new TablesDB(client);

/**
 * Seeds the database with test data.
 */
async function seed() {
  console.log("Starting database seeding...");

  try {
    // 1. Seed Users
    console.log("Seeding users...");
    const usersCollectionId = prefix ? `${prefix}_users` : "users";
    const user1 = await tablesDb.createRow({
      databaseId,
      tableId: usersCollectionId,
      rowId: ID.unique(),
      data: {
        email: "alice@example.com",
        username: "alice",
        bio: "Bio of Alice",
      },
    });
    const user2 = await tablesDb.createRow({
      databaseId,
      tableId: usersCollectionId,
      rowId: ID.unique(),
      data: {
        email: "bob@example.com",
        username: "bob",
        bio: "Bio of Bob",
      },
    });

    // 2. Seed Wishlists
    console.log("Seeding wishlists...");
    const wishlistsCollectionId = prefix ? `${prefix}_wishlists` : "wishlists";
    const wishlist1 = await tablesDb.createRow({
      databaseId,
      tableId: wishlistsCollectionId,
      rowId: ID.unique(),
      data: {
        ownerId: user1.$id,
        title: "Alice's Birthday Wishlist",
        visibility: "public",
        participation: "open",
      },
    });
    const _wishlist2 = await tablesDb.createRow({
      databaseId,
      tableId: wishlistsCollectionId,
      rowId: ID.unique(),
      data: {
        ownerId: user2.$id,
        title: "Bob's Holiday Wishlist",
        visibility: "public",
        participation: "invite_only",
      },
    });

    // 3. Seed Wishlist Items
    console.log("Seeding wishlist items...");
    const itemsCollectionId = prefix
      ? `${prefix}_wishlist_items`
      : "wishlist_items";
    const item1 = await tablesDb.createRow({
      databaseId,
      tableId: itemsCollectionId,
      rowId: ID.unique(),
      data: {
        wishlistId: wishlist1.$id,
        name: "Mechanical Keyboard",
        description: "A nice mechanical keyboard with brown switches",
        priority: 1,
        price: 150.0,
        currency: "USD",
        url: "https://example.com/keyboard",
        totalQuantity: 1,
      },
    });
    const _item2 = await tablesDb.createRow({
      databaseId,
      tableId: itemsCollectionId,
      rowId: ID.unique(),
      data: {
        wishlistId: wishlist1.$id,
        name: "Noise Cancelling Headphones",
        description: "Great for working in loud environments",
        priority: 2,
        price: 300.0,
        currency: "USD",
        url: "https://example.com/headphones",
        totalQuantity: 1,
      },
    });

    // 4. Seed Transactions
    console.log("Seeding transactions...");
    const transactionsCollectionId = prefix
      ? `${prefix}_transactions`
      : "transactions";
    await tablesDb.createRow({
      databaseId,
      tableId: transactionsCollectionId,
      rowId: ID.unique(),
      data: {
        itemId: item1.$id,
        userId: user2.$id,
        status: "reserved",
        quantity: 1,
      },
    });

    console.log("Seeding completed successfully.");
  } catch (error: unknown) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

void seed();
