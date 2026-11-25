/**
 * Result of a wishlist refresh.
 * - `success`: fresh data is on screen.
 * - `failed`: the fetch failed; the previous data is kept.
 * - `superseded`: a newer request took over (or there is nothing to load any more),
 *   so this one has nothing to report.
 */
export type RefreshOutcome = "success" | "failed" | "superseded";
