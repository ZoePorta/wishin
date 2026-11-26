/**
 * Pure helpers used by `scripts/generate-design-docs.ts` to render the design system
 * documentation (`docs/design-system.md`) and its SVG samples.
 */

/** A colour shown in a swatch sheet. */
export interface Swatch {
  /** Token or colour name shown on the swatch. */
  name: string;
  /** Hex colour (`#RRGGBB`). */
  hex: string;
}

/**
 * Escapes a string for use as XML text or attribute content.
 *
 * @param value - Raw text.
 * @returns The escaped text.
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Renders an XML element. Attribute values are stringified and escaped.
 *
 * @param tag - Element name.
 * @param attrs - Attributes (numbers are converted to strings).
 * @param children - Inner markup; omitted for self-closing elements.
 * @returns The element markup.
 */
function element(
  tag: string,
  attrs: Record<string, string | number>,
  children?: string,
): string {
  const attributes = Object.entries(attrs)
    .map(([key, value]) => `${key}="${escapeXml(String(value))}"`)
    .join(" ");
  return children === undefined
    ? `<${tag} ${attributes}/>`
    : `<${tag} ${attributes}>${children}</${tag}>`;
}

/**
 * Replaces the content of a generated section delimited by
 * `<!-- design:NAME:start -->` and `<!-- design:NAME:end -->`.
 *
 * @param markdown - The full document.
 * @param name - Section name.
 * @param content - New content (without surrounding newlines).
 * @returns The updated document.
 * @throws {Error} If the section markers are not found.
 */
export function replaceGeneratedSection(
  markdown: string,
  name: string,
  content: string,
): string {
  const start = `<!-- design:${name}:start -->`;
  const end = `<!-- design:${name}:end -->`;
  const startIndex = markdown.indexOf(start);
  const endIndex = markdown.indexOf(end);
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(`Missing markers for generated section "design:${name}"`);
  }
  return (
    markdown.slice(0, startIndex + start.length) +
    `\n${content}\n` +
    markdown.slice(endIndex)
  );
}

/**
 * Relative luminance of a hex colour (WCAG 2.x).
 *
 * @param hex - Colour as `#RRGGBB`.
 * @returns Luminance between 0 (black) and 1 (white).
 */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map(
    (i) => parseInt(hex.slice(i, i + 2), 16) / 255,
  );
  const [r, g, b] = channels.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Picks black or white text, whichever has the higher contrast on the given background.
 *
 * @param hex - Background colour as `#RRGGBB`.
 * @returns `#000000` or `#FFFFFF`.
 */
export function readableTextColor(hex: string): string {
  const l = luminance(hex);
  const contrastWithBlack = (l + 0.05) / 0.05;
  const contrastWithWhite = 1.05 / (l + 0.05);
  return contrastWithBlack >= contrastWithWhite ? "#000000" : "#FFFFFF";
}

/**
 * Renders a grid of labelled colour swatches as a standalone SVG.
 *
 * @param swatches - Colours to draw, in order.
 * @param columns - Swatches per row.
 * @returns The SVG markup.
 */
export function swatchSheetSvg(swatches: Swatch[], columns = 4): string {
  const width = 216;
  const height = 88;
  const gap = 12;
  const rows = Math.ceil(swatches.length / columns);
  const totalWidth = Math.min(swatches.length, columns) * (width + gap) - gap;
  const totalHeight = rows * (height + gap) - gap;

  const cells = swatches
    .map((swatch, index) => {
      const x = (index % columns) * (width + gap);
      const y = Math.floor(index / columns) * (height + gap);
      const text = readableTextColor(swatch.hex);
      return [
        element("rect", {
          x,
          y,
          width,
          height,
          rx: 12,
          fill: swatch.hex,
          stroke: "#00000022",
        }),
        element(
          "text",
          {
            x: x + 14,
            y: y + 34,
            fill: text,
            "font-size": 14,
            "font-weight": 600,
          },
          escapeXml(swatch.name),
        ),
        element(
          "text",
          {
            x: x + 14,
            y: y + 62,
            fill: text,
            "font-size": 14,
            "font-family": "monospace",
          },
          escapeXml(swatch.hex),
        ),
      ].join("");
    })
    .join("\n");

  return (
    element(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: totalWidth,
        height: totalHeight,
        viewBox: [0, 0, totalWidth, totalHeight].join(" "),
        "font-family":
          "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      },
      `\n${cells}\n`,
    ) + "\n"
  );
}

/**
 * Renders a square diagonal (top-left → bottom-right) gradient as an SVG.
 *
 * @param from - Start colour.
 * @param to - End colour.
 * @param size - Side length in px.
 * @returns The SVG markup.
 */
export function gradientSvg(from: string, to: string, size = 160): string {
  const gradient = element(
    "linearGradient",
    { id: "g", x1: 0, y1: 0, x2: 1, y2: 1 },
    element("stop", { offset: 0, "stop-color": from }) +
      element("stop", { offset: 1, "stop-color": to }),
  );
  return (
    element(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: size,
        height: size,
        viewBox: [0, 0, size, size].join(" "),
      },
      `\n<defs>${gradient}</defs>\n` +
        element("rect", {
          width: size,
          height: size,
          rx: 16,
          fill: "url(#g)",
        }) +
        "\n",
    ) + "\n"
  );
}

/** Input for {@link fontSampleSvg}. */
export interface FontSample {
  /** CSS font family name. */
  family: string;
  /** TTF file contents, base64-encoded (embedded so the sample renders without network access). */
  fontBase64: string;
  /** Lines of text to render, the first one larger. */
  lines: string[];
}

/**
 * Renders a type specimen with the font embedded as a data URI, so it displays correctly
 * on GitHub (which loads SVGs as images, without access to web fonts).
 *
 * @param sample - Font and text to render.
 * @returns The SVG markup.
 */
export function fontSampleSvg(sample: FontSample): string {
  const width = 720;
  const sizes = sample.lines.map((_, i) => (i === 0 ? 44 : 22));
  let y = 0;
  const texts = sample.lines
    .map((line, i) => {
      y += sizes[i] * 1.5;
      return element(
        "text",
        { x: 16, y, "font-size": sizes[i] },
        escapeXml(line),
      );
    })
    .join("\n");
  const height = Math.ceil(y + 20);
  const style = [
    `@font-face { font-family: '${sample.family}'; src: url(data:font/ttf;base64,${sample.fontBase64}) format('truetype'); }`,
    `text { font-family: '${sample.family}'; fill: #2E1A28; }`,
  ].join("\n");

  return (
    element(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width,
        height,
        viewBox: [0, 0, width, height].join(" "),
      },
      `\n<style>\n${style}\n</style>\n` +
        element("rect", { width, height, rx: 12, fill: "#FEF7FF" }) +
        `\n${texts}\n`,
    ) + "\n"
  );
}

/**
 * Renders a GitHub-flavoured markdown table.
 *
 * @param headers - Column headers.
 * @param rows - Table rows (cells are used verbatim except for escaped pipes).
 * @returns The markdown table.
 */
export function markdownTable(headers: string[], rows: string[][]): string {
  const escape = (cell: string) => cell.replace(/\|/g, "\\|");
  return [
    `| ${headers.map(escape).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escape).join(" | ")} |`),
  ].join("\n");
}
