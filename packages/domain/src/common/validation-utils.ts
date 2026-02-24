/**
 * Validates if a string is a valid UUID v4.
 * @param uuid - The string to validate.
 * @returns True if valid UUID v4, false otherwise.
 * @throws {never} This function does not throw.
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates if a string is a valid Appwrite-compatible ID.
 * Appwrite IDs are alphanumeric, periods, hyphens, and underscores.
 * Max length is usually 36 characters.
 *
 * @param id - The string to validate.
 * @returns True if valid Appwrite ID, false otherwise.
 */
export function isValidAppwriteId(id: string): boolean {
  const appwriteIdRegex = /^[a-zA-Z0-9._:-]{1,36}$/;
  return appwriteIdRegex.test(id);
}

/**
 * Validates if a string is a valid identity (either UUID or Appwrite ID).
 * Used for Foreign Keys like userId, ownerId, etc.
 *
 * @param id - The identity string to validate.
 * @returns True if valid identity, false otherwise.
 */
export function isValidIdentity(id: string): boolean {
  return isValidUUID(id) || isValidAppwriteId(id);
}
