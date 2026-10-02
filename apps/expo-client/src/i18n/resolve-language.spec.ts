import { describe, it, expect } from "vitest";
import { resolveLanguage } from "./resolve-language";

describe("resolveLanguage", () => {
  it("should pick Spanish for a Spanish device locale", () => {
    expect(resolveLanguage([{ languageCode: "es" }])).toBe("es");
  });

  it("should pick English for an English device locale", () => {
    expect(resolveLanguage([{ languageCode: "en" }])).toBe("en");
  });

  it("should ignore case and region subtags", () => {
    expect(resolveLanguage([{ languageCode: "ES" }])).toBe("es");
    expect(resolveLanguage([{ languageCode: "es-MX" }])).toBe("es");
  });

  it("should use the first supported language in preference order", () => {
    expect(
      resolveLanguage([
        { languageCode: "fr" },
        { languageCode: "es" },
        { languageCode: "en" },
      ]),
    ).toBe("es");
  });

  it("should fall back to English when no preferred language is supported", () => {
    expect(resolveLanguage([{ languageCode: "fr" }])).toBe("en");
    expect(resolveLanguage([{ languageCode: null }])).toBe("en");
    expect(resolveLanguage([])).toBe("en");
  });
});
