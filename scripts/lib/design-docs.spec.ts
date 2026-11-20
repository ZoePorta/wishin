import { describe, it, expect } from "vitest";
import {
  replaceGeneratedSection,
  readableTextColor,
  swatchSheetSvg,
  gradientSvg,
  fontSampleSvg,
  markdownTable,
} from "./design-docs";

describe("design-docs", () => {
  describe("replaceGeneratedSection", () => {
    const doc = [
      "# Title",
      "<!-- design:palette:start -->",
      "old content",
      "<!-- design:palette:end -->",
      "footer",
    ].join("\n");

    it("should replace the content between the markers", () => {
      const result = replaceGeneratedSection(doc, "palette", "new content");
      expect(result).toBe(
        [
          "# Title",
          "<!-- design:palette:start -->",
          "new content",
          "<!-- design:palette:end -->",
          "footer",
        ].join("\n"),
      );
    });

    it("should be idempotent", () => {
      const once = replaceGeneratedSection(doc, "palette", "x");
      expect(replaceGeneratedSection(once, "palette", "x")).toBe(once);
    });

    it("should throw when the markers are missing", () => {
      expect(() => replaceGeneratedSection(doc, "fonts", "x")).toThrow(
        /design:fonts/,
      );
    });
  });

  describe("readableTextColor", () => {
    it("should use dark text on light colours", () => {
      expect(readableTextColor("#FFFFFF")).toBe("#000000");
      expect(readableTextColor("#FFD6EE")).toBe("#000000");
    });

    it("should use light text on dark colours", () => {
      expect(readableTextColor("#000000")).toBe("#FFFFFF");
      expect(readableTextColor("#4A3068")).toBe("#FFFFFF");
    });
  });

  describe("swatchSheetSvg", () => {
    it("should draw one labelled swatch per entry", () => {
      const svg = swatchSheetSvg([
        { name: "primary", hex: "#E040A0" },
        { name: "surface", hex: "#FEF7FF" },
      ]);
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg.match(/<rect /g)).toHaveLength(2);
      expect(svg).toContain('fill="#E040A0"');
      expect(svg).toContain(">primary<");
      expect(svg).toContain(">#FEF7FF<");
    });

    it("should escape XML in labels", () => {
      const svg = swatchSheetSvg([{ name: "a<b>&c", hex: "#000000" }]);
      expect(svg).toContain("a&lt;b&gt;&amp;c");
    });
  });

  describe("gradientSvg", () => {
    it("should draw a diagonal gradient between both colours", () => {
      const svg = gradientSvg("#FFD6EE", "#C8A8E8");
      expect(svg).toContain('stop-color="#FFD6EE"');
      expect(svg).toContain('stop-color="#C8A8E8"');
      expect(svg).toContain('x1="0" y1="0" x2="1" y2="1"');
    });
  });

  describe("fontSampleSvg", () => {
    it("should embed the font as a data URI and render the sample", () => {
      const svg = fontSampleSvg({
        family: "Aclonica",
        fontBase64: "AAAA",
        lines: ["Wishin", "Aa Bb Cc"],
      });
      expect(svg).toContain("src: url(data:font/ttf;base64,AAAA)");
      expect(svg).toContain("font-family: 'Aclonica'");
      expect(svg).toContain(">Wishin<");
      expect(svg).toContain(">Aa Bb Cc<");
    });
  });

  describe("markdownTable", () => {
    it("should render a GitHub markdown table", () => {
      expect(
        markdownTable(
          ["Token", "Hex"],
          [
            ["primary", "`#E040A0`"],
            ["a|b", "x"],
          ],
        ),
      ).toBe(
        [
          "| Token | Hex |",
          "| --- | --- |",
          "| primary | `#E040A0` |",
          "| a\\|b | x |",
        ].join("\n"),
      );
    });
  });
});
