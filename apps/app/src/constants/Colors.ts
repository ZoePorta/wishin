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
    500: "#64748B", // Muted text [cite: 2026-01-30]
    800: "#1E293B", // Main text [cite: 2026-01-30]
  },
  white: "#FFFFFF",
  black: "#000000",
};

export const Colors = {
  light: {
    primary: palette.pink[400],
    secondary: palette.violet[500],
    background: palette.pink[50],
    card: palette.white,
    text: palette.slate[800],
    textMuted: palette.slate[500],
    // Definition for future gradients
    gradientPrimary: [palette.violet[600], palette.pink[400]],
  },
  dark: {
    primary: palette.pink[400],
    secondary: palette.violet[500],
    background: "#0F172A",
    card: "#1E293B",
    text: palette.white,
    textMuted: palette.slate[500],
    gradientPrimary: [palette.violet[500], palette.pink[600]],
  },
} as const;
