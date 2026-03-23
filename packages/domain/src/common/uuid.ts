/**
 * Cross-environment safe UUID v4 generator.
 * Uses globalThis.crypto.randomUUID() if available, otherwise falls back
 * to a Math.random() based implementation.
 *
 * @returns A string representing a UUID v4.
 */
export function generateUUID(): string {
  const g = globalThis as unknown as {
    crypto?: { randomUUID?: () => string };
  };

  if (g.crypto && typeof g.crypto.randomUUID === "function") {
    return g.crypto.randomUUID();
  }

  // Fallback for environments where crypto.randomUUID is not available (e.g. older RN/Node)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
