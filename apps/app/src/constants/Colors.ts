const palette = {
  pink: {
    50: "#FDF2F8", // Surface / Page background [cite: 2026-01-30]
    400: "#F472B6", // Primary CTA [cite: 2026-01-30]
    600: "#DB2777", // Interactive states [cite: 2026-01-30]
  },
  violet: {
    500: "#8B5CF6", // Header / Secondary actions [cite: 2026-01-30]
    600: "#7C3AED", // Violet gradient start [cite: 2026-01-30]
  },
  slate: {
    100: "#F1F5F9",
    200: "#E2E8F0",
    500: "#64748B",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
  },
  red: {
    100: "#FEE2E2",
  },
  amber: {
    100: "#FEF3C7",
  },
  sky: {
    100: "#E0F2FE",
  },
  white: "#FFFFFF",
  black: "#000000",
};

/**
 * App's themed color palette.
 *
 * @constant
 * Returns a read-only theme color object for light and dark modes.
 *
 * Properties:
 * - light/dark: Theme configuration
 * - primary: Primary brand color
 * - secondary: Secondary brand color
 * - background: Page background color
 * - card: Card/Surface background color
 * - text: Default text color
 * - textMuted: Muted/Secondary text color
 * - surfaceSubtle: Subtle surface/border color (formerly slate100)
 * - surfaceMuted: Muted surface/divider color (formerly slate200)
 * - red100, amber100, sky100: Status background colors
 * - gradientPrimary: Array of two color values [start, end] for primary gradient
 */
export const Colors = {
  light: {
    primary: palette.pink[400],
    secondary: palette.violet[500],
    background: palette.pink[50],
    card: palette.white,
    text: palette.slate[800],
    textMuted: palette.slate[500],
    surfaceSubtle: palette.slate[100],
    surfaceMuted: palette.slate[200],
    red100: palette.red[100],
    amber100: palette.amber[100],
    sky100: palette.sky[100],
    // Definition for future gradients
    gradientPrimary: [palette.violet[600], palette.pink[400]],
  },
  dark: {
    primary: palette.pink[400],
    secondary: palette.violet[500],
    background: palette.slate[900], // #0F172A
    card: palette.slate[800], // #1E293B
    text: palette.white,
    textMuted: palette.slate[500],
    surfaceSubtle: palette.slate[800], // Map to dark equivalents if possible, or just keep distinct
    surfaceMuted: palette.slate[700],
    red100: "#7F1D1D", // Dark red
    amber100: "#78350F", // Dark amber
    sky100: "#0C4A6E", // Dark sky
    gradientPrimary: [palette.violet[500], palette.pink[600]],
  },
} as const;
