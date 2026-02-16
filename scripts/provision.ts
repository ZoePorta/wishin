import { Client, Databases } from "node-appwrite";
import "dotenv/config";

const {
  EXPO_PUBLIC_APPWRITE_ENDPOINT,
  EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  APPWRITE_API_SECRET,
  EXPO_PUBLIC_APPWRITE_DATABASE_ID,
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

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

interface Attribute {
  key: string;
  type: "string" | "integer" | "boolean" | "double" | "datetime";
  required: boolean;
  size?: number;
  default?: string | number | boolean;
  array?: boolean;
}

interface CollectionSchema {
  id: string;
  name: string;
  attributes: Attribute[];
}

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
      { key: "ownerId", type: "string", required: true, size: 36 },
      { key: "title", type: "string", required: true, size: 100 },
      { key: "description", type: "string", required: false, size: 500 },
      { key: "visibility", type: "string", required: true, size: 20 },
      { key: "participation", type: "string", required: true, size: 20 },
      { key: "createdAt", type: "datetime", required: true },
      { key: "updatedAt", type: "datetime", required: true },
    ],
  },
  {
    id: "wishlist_items",
    name: "Wishlist Items",
    attributes: [
      { key: "wishlistId", type: "string", required: true, size: 36 },
      { key: "name", type: "string", required: true, size: 100 },
      { key: "description", type: "string", required: false, size: 500 },
      { key: "priority", type: "integer", required: true },
      { key: "price", type: "double", required: false },
      { key: "currency", type: "string", required: false, size: 3 },
      { key: "url", type: "string", required: false, size: 2048 },
      { key: "imageUrl", type: "string", required: false, size: 2048 },
      { key: "isUnlimited", type: "boolean", required: false, default: false },
      { key: "totalQuantity", type: "integer", required: false, default: 1 },
      { key: "reservedQuantity", type: "integer", required: false, default: 0 },
      {
        key: "purchasedQuantity",
        type: "integer",
        required: false,
        default: 0,
      },
    ],
  },
  {
    id: "transactions",
    name: "Transactions",
    attributes: [
      { key: "itemId", type: "string", required: true, size: 36 },
      { key: "userId", type: "string", required: false, size: 36 },
      { key: "guestSessionId", type: "string", required: false, size: 255 },
      { key: "status", type: "string", required: true, size: 20 },
      { key: "quantity", type: "integer", required: false, default: 1 },
      { key: "createdAt", type: "datetime", required: true },
      { key: "updatedAt", type: "datetime", required: true },
    ],
  },
];

async function provision() {
  try {
    // 1. Database
    try {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      await databases.get(databaseId);
      console.log(`Database "${databaseId}" already exists.`);
    } catch (error: unknown) {
      if ((error as { code: number }).code === 404) {
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        await databases.create(databaseId, databaseId);
        console.log(`Database "${databaseId}" created.`);
      } else {
        throw error;
      }
    }

    // 2. Collections & Attributes
    for (const coll of schema) {
      let collection;
      try {
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        collection = await databases.getCollection(databaseId, coll.id);
        console.log(`Collection "${coll.name}" (${coll.id}) already exists.`);
      } catch (error: unknown) {
        if ((error as { code: number }).code === 404) {
          // eslint-disable-next-line @typescript-eslint/no-deprecated
          collection = await databases.createCollection(
            databaseId,
            coll.id,
            coll.name,
          );
          console.log(`Collection "${coll.name}" (${coll.id}) created.`);
        } else {
          throw error;
        }
      }

      // Check Attributes
      const existingAttributes = (
        collection.attributes as { key: string }[]
      ).map((a) => a.key);
      for (const attr of coll.attributes) {
        if (existingAttributes.includes(attr.key)) {
          // console.log(`Attribute "${attr.key}" in "${coll.id}" already exists.`);
          continue;
        }

        console.log(`Creating attribute "${attr.key}" in "${coll.id}"...`);
        switch (attr.type) {
          case "string":
            // eslint-disable-next-line @typescript-eslint/no-deprecated
            await databases.createStringAttribute(
              databaseId,
              coll.id,
              attr.key,
              attr.size ?? 255,
              attr.required,
              attr.default as string | undefined,
            );
            break;
          case "integer":
            // eslint-disable-next-line @typescript-eslint/no-deprecated
            await databases.createIntegerAttribute(
              databaseId,
              coll.id,
              attr.key,
              attr.required,
              undefined,
              undefined,
              attr.default as number | undefined,
            );
            break;
          case "boolean":
            // eslint-disable-next-line @typescript-eslint/no-deprecated
            await databases.createBooleanAttribute(
              databaseId,
              coll.id,
              attr.key,
              attr.required,
              attr.default as boolean | undefined,
            );
            break;
          case "double":
            // eslint-disable-next-line @typescript-eslint/no-deprecated
            await databases.createFloatAttribute(
              databaseId,
              coll.id,
              attr.key,
              attr.required,
              undefined,
              undefined,
              attr.default as number | undefined,
            );
            break;
          case "datetime":
            // eslint-disable-next-line @typescript-eslint/no-deprecated
            await databases.createDatetimeAttribute(
              databaseId,
              coll.id,
              attr.key,
              attr.required,
              attr.default as string | undefined,
            );
            break;
        }
      }
    }

    console.log("Provisioning completed successfully.");
  } catch (error: unknown) {
    console.error("Provisioning failed:", error);
    process.exit(1);
  }
}

void provision();
