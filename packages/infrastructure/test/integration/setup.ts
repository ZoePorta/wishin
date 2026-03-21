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

// Global mock for react-native-appwrite to avoid SyntaxErrors in Vitest (Node) environment.
vi.mock("react-native-appwrite", () => ({
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
}));

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
