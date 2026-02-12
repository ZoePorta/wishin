/**
 * Controls who can perform actions (reserve/purchase) on wishlist items.
 * - ANYONE: Any viewer can participate.
 * - REGISTERED: Only registered users can participate.
 * - CONTACTS: Only contacts of the owner can participate.
 */
export enum Participation {
  ANYONE = "ANYONE",
  REGISTERED = "REGISTERED",
  CONTACTS = "CONTACTS",
}
