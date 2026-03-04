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

// Appwrite SDK environment checks
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
global.window = global as any;
