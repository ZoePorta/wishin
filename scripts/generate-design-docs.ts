/**
 * Regenerates the design system documentation from the app's theme sources:
 * - SVG samples in `docs/design/` (colour swatches, brand gradient, font specimens)
 * - the generated sections of `docs/design-system.md` (between `<!-- design:NAME:start/end -->`)
 *
 * Usage:
 *   pnpm docs:design
 *
 * Run it after changing `material-theme.json`, `type-scale.ts`, `spacing.ts` or `typography.ts`.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import {
  replaceGeneratedSection,
  swatchSheetSvg,
  gradientSvg,
  fontSampleSvg,
  markdownTable,
  type Swatch,
} from "./lib/design-docs";
import { typography } from "../apps/expo-client/src/theme/type-scale";
import { Spacing } from "../apps/expo-client/src/theme/spacing";
import { Typography } from "../apps/expo-client/src/theme/typography";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const themeDir = join(root, "apps/expo-client/src/theme");
const outDir = join(root, "docs/design");
const docPath = join(root, "docs/design-system.md");

type Scheme = Record<string, string>;
interface MaterialTheme {
  seed: string;
  coreColors: Record<string, string>;
  schemes: Record<"light" | "dark", Scheme>;
}

const theme = JSON.parse(
  readFileSync(join(themeDir, "material-theme.json"), "utf8"),
) as MaterialTheme;

/** Token groups shown as separate swatch sheets, in display order. */
const GROUPS: Record<string, string[]> = {
  accents: [
    "primary",
    "onPrimary",
    "primaryContainer",
    "onPrimaryContainer",
    "secondary",
    "onSecondary",
    "secondaryContainer",
    "onSecondaryContainer",
    "tertiary",
    "onTertiary",
    "tertiaryContainer",
    "onTertiaryContainer",
    "error",
    "onError",
    "errorContainer",
    "onErrorContainer",
  ],
  fixed: [
    "primaryFixed",
    "primaryFixedDim",
    "onPrimaryFixed",
    "onPrimaryFixedVariant",
    "secondaryFixed",
    "secondaryFixedDim",
    "onSecondaryFixed",
    "onSecondaryFixedVariant",
    "tertiaryFixed",
    "tertiaryFixedDim",
    "onTertiaryFixed",
    "onTertiaryFixedVariant",
  ],
  surfaces: [
    "background",
    "onBackground",
    "surface",
    "onSurface",
    "surfaceVariant",
    "onSurfaceVariant",
    "surfaceDim",
    "surfaceBright",
    "surfaceContainerLowest",
    "surfaceContainerLow",
    "surfaceContainer",
    "surfaceContainerHigh",
    "surfaceContainerHighest",
  ],
  other: [
    "outline",
    "outlineVariant",
    "inverseSurface",
    "inverseOnSurface",
    "inversePrimary",
    "surfaceTint",
    "shadow",
    "scrim",
  ],
};

/**
 * Writes a generated file and logs it.
 *
 * @param name - File name inside `docs/design/`.
 * @param content - File contents.
 */
function writeAsset(name: string, content: string): void {
  writeFileSync(join(outDir, name), content);
  console.log(`  docs/design/${name}`);
}

/**
 * Resolves a font file shipped by an `@expo-google-fonts/*` package.
 *
 * @param pkg - Package name.
 * @param file - Path of the TTF inside the package.
 * @returns The TTF contents as base64.
 */
function loadFont(pkg: string, file: string): string {
  const require = createRequire(join(root, "apps/expo-client/package.json"));
  const pkgDir = dirname(require.resolve(`${pkg}/package.json`));
  return readFileSync(join(pkgDir, file)).toString("base64");
}

mkdirSync(outDir, { recursive: true });
console.log("Generating design assets:");

// Core colours
const coreSwatches: Swatch[] = Object.entries(theme.coreColors).map(
  ([name, hex]) => ({ name, hex: hex.toUpperCase() }),
);
writeAsset("core-colors.svg", swatchSheetSvg(coreSwatches, 3));

// Scheme palettes. Groups whose tokens are identical in both schemes (e.g. Fixed) get one sheet.
const sameInBothSchemes = (tokens: string[]) =>
  tokens.every((t) => theme.schemes.light[t] === theme.schemes.dark[t]);

for (const [group, tokens] of Object.entries(GROUPS)) {
  const schemes = sameInBothSchemes(tokens)
    ? (["light"] as const)
    : (["light", "dark"] as const);
  for (const scheme of schemes) {
    const swatches = tokens.map((name) => ({
      name,
      hex: theme.schemes[scheme][name].toUpperCase(),
    }));
    writeAsset(`palette-${scheme}-${group}.svg`, swatchSheetSvg(swatches, 4));
  }
}

// Brand gradient (used by the placeholder images)
writeAsset(
  "brand-gradient.svg",
  gradientSvg(
    theme.schemes.light.primaryFixed.toUpperCase(),
    theme.schemes.light.secondaryFixedDim.toUpperCase(),
  ),
);

// Font specimens
writeAsset(
  "font-aclonica.svg",
  fontSampleSvg({
    family: "Aclonica",
    fontBase64: loadFont(
      "@expo-google-fonts/aclonica",
      "400Regular/Aclonica_400Regular.ttf",
    ),
    lines: [
      "Wishin — My Wishlist",
      "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ",
      "abcdefghijklmnñopqrstuvwxyz 0123456789",
    ],
  }),
);
writeAsset(
  "font-varela-round.svg",
  fontSampleSvg({
    family: "Varela Round",
    fontBase64: loadFont(
      "@expo-google-fonts/varela-round",
      "400Regular/VarelaRound_400Regular.ttf",
    ),
    lines: [
      "Share your wishes ✨",
      "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ",
      "abcdefghijklmnñopqrstuvwxyz 0123456789 ¿?¡! €",
    ],
  }),
);

// Markdown sections
let doc = readFileSync(docPath, "utf8");

doc = replaceGeneratedSection(
  doc,
  "core-colors",
  [
    `Seed: \`${theme.seed.toUpperCase()}\``,
    "",
    "![Core colours](design/core-colors.svg)",
    "",
    markdownTable(
      ["Role", "Hex"],
      coreSwatches.map((s) => [s.name, `\`${s.hex}\``]),
    ),
  ].join("\n"),
);

const groupTitles: Record<string, string> = {
  accents: "Accents",
  fixed: "Fixed",
  surfaces: "Surfaces & content",
  other: "Outlines, inverse & utility",
};
doc = replaceGeneratedSection(
  doc,
  "palette",
  [
    ...Object.entries(GROUPS).flatMap(([group, tokens]) =>
      sameInBothSchemes(tokens)
        ? [
            `#### ${groupTitles[group]}`,
            "",
            "_Same values in light and dark._",
            "",
            `![${groupTitles[group]}](design/palette-light-${group}.svg)`,
            "",
          ]
        : [
            `#### ${groupTitles[group]}`,
            "",
            "**Light**",
            "",
            `![${groupTitles[group]}, light](design/palette-light-${group}.svg)`,
            "",
            "**Dark**",
            "",
            `![${groupTitles[group]}, dark](design/palette-dark-${group}.svg)`,
            "",
          ],
    ),
    "<details>",
    "<summary>All tokens as text (light / dark)</summary>",
    "",
    markdownTable(
      ["Token", "Light", "Dark"],
      Object.values(GROUPS)
        .flat()
        .map((token) => [
          `\`${token}\``,
          `\`${theme.schemes.light[token].toUpperCase()}\``,
          `\`${theme.schemes.dark[token].toUpperCase()}\``,
        ]),
    ),
    "",
    "</details>",
  ].join("\n"),
);

doc = replaceGeneratedSection(
  doc,
  "type-scale",
  markdownTable(
    ["Variant", "Font", "Size", "Line height", "Letter spacing"],
    Object.entries(typography).map(([variant, style]) => [
      `\`${variant}\``,
      style.fontFamily.startsWith("Aclonica") ? "Aclonica" : "Varela Round",
      String(style.fontSize),
      String(style.lineHeight),
      String(style.letterSpacing),
    ]),
  ),
);

doc = replaceGeneratedSection(
  doc,
  "spacing",
  markdownTable(
    ["Token", "px"],
    Object.entries(Spacing).map(([name, px]) => [
      `\`Spacing.${name}\``,
      String(px),
    ]),
  ),
);

doc = replaceGeneratedSection(
  doc,
  "font-sizes",
  markdownTable(
    ["Token", "px"],
    Object.entries(Typography.size).map(([name, px]) => [
      `\`Typography.size.${name}\``,
      String(px),
    ]),
  ),
);

writeFileSync(docPath, doc);
console.log("Updated docs/design-system.md");
