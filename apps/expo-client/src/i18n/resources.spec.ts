import { describe, it, expect } from "vitest";
import { resources, SUPPORTED_LANGUAGES } from "./resources";
import { createI18n } from "./create-i18n";

interface Tree {
  [key: string]: string | Tree;
}

/** Flattens a nested resource into `dotted.key -> value` pairs. */
const flatten = (tree: Tree, prefix = ""): Record<string, string> =>
  Object.entries(tree).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string"
      ? { ...acc, [path]: value }
      : { ...acc, ...flatten(value, path) };
  }, {});

/** Extracts the interpolation variable names used in a translation. */
const placeholders = (value: string): string[] =>
  [...value.matchAll(/{{\s*(\w+)/g)].map((m) => m[1]).sort();

describe("translation resources", () => {
  const english = flatten(resources.en.translation as Tree);

  it.each(SUPPORTED_LANGUAGES.filter((lng) => lng !== "en"))(
    "%s should define exactly the same keys as English",
    (lng) => {
      const translated = flatten(resources[lng].translation as Tree);
      expect(Object.keys(translated).sort()).toEqual(
        Object.keys(english).sort(),
      );
    },
  );

  it.each(SUPPORTED_LANGUAGES.filter((lng) => lng !== "en"))(
    "%s should use the same interpolation variables as English",
    (lng) => {
      const translated = flatten(resources[lng].translation as Tree);
      for (const [key, value] of Object.entries(english)) {
        expect(placeholders(translated[key]), key).toEqual(placeholders(value));
      }
    },
  );

  it("should not leave empty translations", () => {
    for (const lng of SUPPORTED_LANGUAGES) {
      const values = Object.values(flatten(resources[lng].translation as Tree));
      expect(values.every((v) => v.trim().length > 0)).toBe(true);
    }
  });
});

describe("createI18n", () => {
  it("should translate into the requested language", () => {
    expect(createI18n("es").t("common.cancel")).toBe("Cancelar");
    expect(createI18n("en").t("common.cancel")).toBe("Cancel");
  });

  it("should format prices with the conventions of each language", () => {
    expect(
      createI18n("en").t("item.price", { amount: 1234.5, symbol: "€" }),
    ).toBe("€ 1,234.50");
    expect(
      createI18n("es").t("item.price", { amount: 1234.5, symbol: "€" }),
    ).toBe("1234,50 €");
  });
});
