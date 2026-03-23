/**
 * Lightweight LocalStorage polyfill for Appwrite client SDK in Node.js.
 * This ensures session persistence between requests during integration tests.
 */
const storage: Record<string, string> = {};

global.localStorage = {
  getItem: (key: string) => storage[key] || null,
  setItem: (key: string, value: string) => {
    storage[key] = value;
  },
  removeItem: (key: string) => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete storage[key];
  },
  clear: () => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    for (const key in storage) delete storage[key];
  },
  get length() {
    return Object.keys(storage).length;
  },
  key: (index: number) => Object.keys(storage)[index] || null,
} as Storage;

import { vi } from "vitest";

// Global mock for react-native-appwrite.
// In Unit Tests: We use a lightweight mock to avoid SyntaxErrors and speed up execution.
// In Integration Tests: We delegate to 'node-appwrite' for types/constants but provide a functional
// session-aware shim for Account to mimic the Client SDK behavior in Node.js.
vi.mock("react-native-appwrite", async (_importOriginal) => {
  if (process.env.IS_INTEGRATION_TEST === "true") {
    const nodeAppwrite = await import("node-appwrite");

    // In-memory user store for simulation during tests
    interface MockUser {
      $id: string;
      email: string;
      name: string;
    }
    const mockUsers = new Map<string, MockUser>();
    const mockEmails = new Map<string, string>(); // email -> userId

    // Session-aware mock for Account
    class MockAccount {
      client: unknown;
      constructor(client: unknown) {
        this.client = client;
      }

      async get() {
        const sessionData = global.localStorage.getItem("appwrite_session");
        if (!sessionData) {
          throw new nodeAppwrite.AppwriteException("Unauthorized", 401);
        }
        const session = JSON.parse(sessionData) as MockUser;
        return mockUsers.get(session.$id) ?? session;
      }

      async createEmailPasswordSession({
        email,
        password,
      }: {
        email: string;
        password: string;
      }) {
        const userId = mockEmails.get(email);
        if (!userId || password === "WrongPassword123!") {
          throw new nodeAppwrite.AppwriteException("Invalid credentials", 401);
        }
        const user = mockUsers.get(userId);
        if (!user) {
          throw new nodeAppwrite.AppwriteException("User not found", 404);
        }
        global.localStorage.setItem("appwrite_session", JSON.stringify(user));
        return { $id: "session-id", userId: user.$id };
      }

      async createAnonymousSession() {
        const userId = "anonymous-" + Math.random().toString(36).substring(7);
        const user: MockUser = { $id: userId, name: "Guest", email: "" };
        mockUsers.set(userId, user);
        global.localStorage.setItem("appwrite_session", JSON.stringify(user));
        return { $id: "session-id", userId: user.$id };
      }

      async deleteSession({ sessionId }: { sessionId: string }) {
        if (sessionId === "current") {
          global.localStorage.removeItem("appwrite_session");
        }
        return {};
      }

      async updateEmail({ email }: { email: string }) {
        const sessionData = global.localStorage.getItem("appwrite_session");
        if (!sessionData)
          throw new nodeAppwrite.AppwriteException("Unauthorized", 401);
        const user = JSON.parse(sessionData) as MockUser;
        user.email = email;
        mockUsers.set(user.$id, user);
        mockEmails.set(email, user.$id);
        global.localStorage.setItem("appwrite_session", JSON.stringify(user));
        return user;
      }

      async updateName({ name }: { name: string }) {
        const sessionData = global.localStorage.getItem("appwrite_session");
        if (!sessionData)
          throw new nodeAppwrite.AppwriteException("Unauthorized", 401);
        const user = JSON.parse(sessionData) as MockUser;
        user.name = name;
        mockUsers.set(user.$id, user);
        global.localStorage.setItem("appwrite_session", JSON.stringify(user));
        return user;
      }

      async create({
        userId,
        email,
        name,
      }: {
        userId?: string;
        email: string;
        name: string;
      }) {
        const id =
          userId === "unique-id" || !userId
            ? "user-" + Math.random().toString(36).substring(7)
            : userId;
        const user: MockUser = { $id: id, email, name };
        mockUsers.set(id, user);
        mockEmails.set(email, id);
        return user;
      }
    }

    return {
      ...nodeAppwrite,
      Account: MockAccount,
      Storage: nodeAppwrite.Storage, // node-appwrite.Storage is compatible enough
    };
  }

  // Unit Test Mock (default)
  return {
    Client: vi.fn().mockImplementation(() => ({
      setEndpoint: vi.fn().mockReturnThis(),
      setProject: vi.fn().mockReturnThis(),
    })),
    Account: vi.fn(),
    Storage: vi.fn(),
    Databases: vi.fn(),
    ID: { unique: () => "unique-id" },
    Query: {},
    Models: {},
  };
});

export {};

// Restore type safety for global.window
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      window: Window & typeof globalThis;
    }
  }
}

(global as unknown as { window: unknown }).window = global;
