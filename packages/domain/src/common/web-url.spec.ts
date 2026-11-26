import { describe, it, expect } from "vitest";
import { isValidWebUrl, normalizeWebUrl } from "./web-url";

describe("web-url", () => {
  describe("isValidWebUrl", () => {
    it("should accept http and https URLs with a dotted host", () => {
      expect(isValidWebUrl("https://example.com")).toBe(true);
      expect(isValidWebUrl("http://shop.example.es/item?id=1")).toBe(true);
      expect(isValidWebUrl("HTTPS://EXAMPLE.COM/x")).toBe(true);
    });

    it("should reject strings that are not URLs", () => {
      expect(isValidWebUrl("invalid-url")).toBe(false);
      expect(isValidWebUrl("hello world")).toBe(false);
      expect(isValidWebUrl("")).toBe(false);
    });

    it("should reject non-web schemes", () => {
      expect(isValidWebUrl("javascript:alert(1)")).toBe(false);
      expect(isValidWebUrl("ftp://example.com/file")).toBe(false);
      expect(isValidWebUrl("mailto:someone@example.com")).toBe(false);
      expect(isValidWebUrl("data:text/html,<p>hi</p>")).toBe(false);
    });

    it("should reject hosts without a dot", () => {
      expect(isValidWebUrl("https://hello")).toBe(false);
      expect(isValidWebUrl("http://localhost:3000")).toBe(false);
    });
  });

  describe("normalizeWebUrl", () => {
    it("should trim surrounding whitespace", () => {
      expect(normalizeWebUrl("  https://example.com  ")).toBe(
        "https://example.com",
      );
    });

    it("should prepend https:// when the scheme is missing", () => {
      expect(normalizeWebUrl("amazon.es/item")).toBe("https://amazon.es/item");
      expect(normalizeWebUrl("www.example.com")).toBe(
        "https://www.example.com",
      );
      expect(normalizeWebUrl("example.com:8080/x")).toBe(
        "https://example.com:8080/x",
      );
    });

    it("should keep an existing scheme untouched", () => {
      expect(normalizeWebUrl("http://example.com")).toBe("http://example.com");
      expect(normalizeWebUrl("javascript:alert(1)")).toBe(
        "javascript:alert(1)",
      );
    });

    it("should return an empty string for blank input", () => {
      expect(normalizeWebUrl("   ")).toBe("");
    });
  });
});
