import { Client, TablesDB, type Models } from "node-appwrite";
import "dotenv/config";
import { Visibility, Participation, TransactionStatus } from "@wishin/domain";

const REQUIRED_ENV_VARS = [
  "EXPO_PUBLIC_APPWRITE_ENDPOINT",
  "EXPO_PUBLIC_APPWRITE_PROJECT_ID",
  "APPWRITE_API_SECRET",
  "EXPO_PUBLIC_APPWRITE_DATABASE_ID",
] as const;

const missingVars = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);

if (missingVars.length > 0) {
  console.error(
    `Missing required environment variables: ${missingVars.join(", ")}`,
  );
  process.exit(1);
}

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ?? "";
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID ?? "";
const apiKey = process.env.APPWRITE_API_SECRET ?? "";
const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? "";
const prefix = process.env.EXPO_PUBLIC_DB_PREFIX ?? "";

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const tablesDb = new TablesDB(client);

/**
 * Interfaces for database models to ensure type safety.
 * We use intersection types with Models.Row to satisfy TablesDB constraints.
 */
interface UserData {
  email: string;
  username: string;
  bio?: string;
}
type UserRow = UserData & Models.Row;

interface WishlistData {
  ownerId: string;
  title: string;
  visibility: Visibility;
  participation: Participation;
}
type WishlistRow = WishlistData & Models.Row;

interface ItemData {
  wishlistId: string;
  name: string;
  description?: string;
  priority: number;
  price?: number;
  currency?: string;
  url?: string;
  imageUrl?: string;
  isUnlimited?: boolean;
  totalQuantity?: number;
}
type ItemRow = ItemData & Models.Row;

interface TransactionData {
  itemId: string;
  userId?: string;
  status: TransactionStatus;
  quantity: number;
}
type TransactionRow = TransactionData & Models.Row;

/**
 * Stable UUIDs for idempotency.
 */
const SEED_IDS = {
  USERS: {
    ALICE: "550e8400-e29b-41d4-a716-446655440001",
    BOB: "550e8400-e29b-41d4-a716-446655440002",
  },
  WISHLISTS: {
    ALICE_BIRTHDAY: "550e8400-e29b-41d4-a716-446655440003",
    BOB_HOLIDAY: "550e8400-e29b-41d4-a716-446655440004",
  },
  ITEMS: {
    KEYBOARD: "550e8400-e29b-41d4-a716-446655440005",
    HEADPHONES: "550e8400-e29b-41d4-a716-446655440006",
    JS_BOOK: "550e8400-e29b-41d4-a716-446655440007",
    SOCKS: "550e8400-e29b-41d4-a716-446655440008",
    WATER_BOTTLE: "550e8400-e29b-41d4-a716-446655440009",
    WATCH: "550e8400-e29b-41d4-a716-44665544000a",
    CAMERA: "550e8400-e29b-41d4-a716-44665544000b",
  },
  TRANSACTIONS: {
    RESERVATION_1: "550e8400-e29b-41d4-a716-44665544000c",
    RESERVATION_2: "550e8400-e29b-41d4-a716-44665544000d",
    PURCHASE_1: "550e8400-e29b-41d4-a716-44665544000e",
  },
} as const;

/**
 * Seeds the database with test data.
 */
async function seed() {
  console.log("Starting database seeding...");

  try {
    // 1. Seed Users
    console.log("Seeding users...");
    const usersCollectionId = prefix ? `${prefix}_users` : "users";
    const user1 = await tablesDb.upsertRow<UserRow>({
      databaseId,
      tableId: usersCollectionId,
      rowId: SEED_IDS.USERS.ALICE,
      data: {
        email: "alice@example.com",
        username: "alice",
        bio: "Bio of Alice",
      },
    });
    const user2 = await tablesDb.upsertRow<UserRow>({
      databaseId,
      tableId: usersCollectionId,
      rowId: SEED_IDS.USERS.BOB,
      data: {
        email: "bob@example.com",
        username: "bob",
        bio: "Bio of Bob",
      },
    });

    // 2. Seed Wishlists
    console.log("Seeding wishlists...");
    const wishlistsCollectionId = prefix ? `${prefix}_wishlists` : "wishlists";
    const wishlist1 = await tablesDb.upsertRow<WishlistRow>({
      databaseId,
      tableId: wishlistsCollectionId,
      rowId: SEED_IDS.WISHLISTS.ALICE_BIRTHDAY,
      data: {
        ownerId: user1.$id,
        title: "Alice's Birthday Wishlist",
        visibility: Visibility.LINK,
        participation: Participation.ANYONE,
      },
    });
    await tablesDb.upsertRow<WishlistRow>({
      databaseId,
      tableId: wishlistsCollectionId,
      rowId: SEED_IDS.WISHLISTS.BOB_HOLIDAY,
      data: {
        ownerId: user2.$id,
        title: "Bob's Holiday Wishlist",
        visibility: Visibility.LINK,
        participation: Participation.ANYONE,
      },
    });

    // 3. Seed Wishlist Items
    console.log("Seeding wishlist items...");
    const itemsCollectionId = prefix
      ? `${prefix}_wishlist_items`
      : "wishlist_items";

    const item1 = await tablesDb.upsertRow<ItemRow>({
      databaseId,
      tableId: itemsCollectionId,
      rowId: SEED_IDS.ITEMS.KEYBOARD,
      data: {
        wishlistId: wishlist1.$id,
        name: "Mechanical Keyboard",
        description: "A nice mechanical keyboard with brown switches",
        priority: 1,
        price: 150.0,
        currency: "USD",
        url: "https://example.com/keyboard",
        imageUrl:
          "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800&q=80",
        totalQuantity: 3,
      },
    });

    await tablesDb.upsertRow<ItemRow>({
      databaseId,
      tableId: itemsCollectionId,
      rowId: SEED_IDS.ITEMS.HEADPHONES,
      data: {
        wishlistId: wishlist1.$id,
        name: "Noise Cancelling Headphones",
        description: "Great for working in loud environments",
        priority: 2,
        price: 300.0,
        currency: "USD",
        imageUrl:
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
        totalQuantity: 2,
      },
    });

    await tablesDb.upsertRow<ItemRow>({
      databaseId,
      tableId: itemsCollectionId,
      rowId: SEED_IDS.ITEMS.JS_BOOK,
      data: {
        wishlistId: wishlist1.$id,
        name: "JavaScript: The Good Parts",
        description: "A classic programming book",
        priority: 3,
        url: "https://example.com/js-book",
        imageUrl:
          "https://images.unsplash.com/photo-1589998059171-988d887df646?w=800&q=80",
        totalQuantity: 1,
      },
    });

    await tablesDb.upsertRow<ItemRow>({
      databaseId,
      tableId: itemsCollectionId,
      rowId: SEED_IDS.ITEMS.SOCKS,
      data: {
        wishlistId: wishlist1.$id,
        name: "Cozy Wool Socks",
        priority: 4,
        isUnlimited: true,
      },
    });

    await tablesDb.upsertRow<ItemRow>({
      databaseId,
      tableId: itemsCollectionId,
      rowId: SEED_IDS.ITEMS.WATER_BOTTLE,
      data: {
        wishlistId: wishlist1.$id,
        name: "Simple Water Bottle",
        priority: 4,
        price: 20.0,
        currency: "USD",
        imageUrl:
          "https://images.unsplash.com/photo-1523362622744-8c1303cc1014?w=800&q=80",
        totalQuantity: 5,
      },
    });

    const item6 = await tablesDb.upsertRow<ItemRow>({
      databaseId,
      tableId: itemsCollectionId,
      rowId: SEED_IDS.ITEMS.WATCH,
      data: {
        wishlistId: wishlist1.$id,
        name: "Luxury Watch",
        description: "A beautiful timepiece",
        priority: 1,
        price: 500.0,
        currency: "USD",
        imageUrl:
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
        totalQuantity: 1,
      },
    });

    const item7 = await tablesDb.upsertRow<ItemRow>({
      databaseId,
      tableId: itemsCollectionId,
      rowId: SEED_IDS.ITEMS.CAMERA,
      data: {
        wishlistId: wishlist1.$id,
        name: "Professional Camera",
        description: "For high-quality photography",
        priority: 1,
        price: 1200.0,
        currency: "USD",
        totalQuantity: 1,
      },
    });

    // 4. Seed Transactions
    console.log("Seeding transactions...");
    const transactionsCollectionId = prefix
      ? `${prefix}_transactions`
      : "transactions";

    // Item 1: Partially reserved (1/3)
    await tablesDb.upsertRow<TransactionRow>({
      databaseId,
      tableId: transactionsCollectionId,
      rowId: SEED_IDS.TRANSACTIONS.RESERVATION_1,
      data: {
        itemId: item1.$id,
        userId: user2.$id,
        status: TransactionStatus.RESERVED,
        quantity: 1,
      },
    });

    // Item 6: Fully reserved (1/1)
    await tablesDb.upsertRow<TransactionRow>({
      databaseId,
      tableId: transactionsCollectionId,
      rowId: SEED_IDS.TRANSACTIONS.RESERVATION_2,
      data: {
        itemId: item6.$id,
        userId: user2.$id,
        status: TransactionStatus.RESERVED,
        quantity: 1,
      },
    });

    // Item 7: Fully purchased (1/1)
    await tablesDb.upsertRow<TransactionRow>({
      databaseId,
      tableId: transactionsCollectionId,
      rowId: SEED_IDS.TRANSACTIONS.PURCHASE_1,
      data: {
        itemId: item7.$id,
        userId: user2.$id,
        status: TransactionStatus.PURCHASED,
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
