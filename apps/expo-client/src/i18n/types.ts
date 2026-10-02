import type { en } from "./locales/en";

/** Recursively maps every leaf of a resource tree to `string`. */
type DeepStringRecord<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringRecord<T[K]>;
};

/**
 * Shape every locale must implement: the same keys as the English source, with any string values.
 */
export type TranslationResource = DeepStringRecord<typeof en>;
