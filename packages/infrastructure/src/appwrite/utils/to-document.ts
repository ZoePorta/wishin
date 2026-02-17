import type { Models } from "appwrite";

/**
 * Casts an unknown value to an Appwrite Document or array of Documents.
 * Useful for bridging the gap between node-appwrite (server) types and appwrite (client) types,
 * or when dealing with untyped responses.
 *
 * @param doc - The document(s) to cast.
 * @returns The document(s) cast to T.
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function toDocument<T extends Models.Document | Models.Document[]>(
  doc: unknown,
): T {
  return doc as T;
}
