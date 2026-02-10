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
