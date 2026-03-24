import materialTheme from "./material-theme.json";

/**
 * Shared theme tokens extracted from the Material Design 3 scheme.
 * This is the single source of truth for colors and typography.
 */
export const themeTokens = {
  colors: {
    primary: materialTheme.schemes.light.primary,
    "on-primary": materialTheme.schemes.light.onPrimary,
    "on-primary-fixed-variant":
      materialTheme.schemes.light.onPrimaryFixedVariant,
    secondary: materialTheme.schemes.light.secondary,
    "on-secondary": materialTheme.schemes.light.onSecondary,
    tertiary: materialTheme.schemes.light.tertiary,
    "on-tertiary": materialTheme.schemes.light.onTertiary,
    background: materialTheme.schemes.light.background,
    "on-surface": materialTheme.schemes.light.onSurface,
    "on-surface-variant": materialTheme.schemes.light.onSurfaceVariant,
    "outline-variant": materialTheme.schemes.light.outlineVariant,
    "primary-fixed": materialTheme.schemes.light.primaryFixed,
    "primary-fixed-dim": materialTheme.schemes.light.primaryFixedDim,
    "secondary-fixed": materialTheme.schemes.light.secondaryFixed,
    "secondary-fixed-dim": materialTheme.schemes.light.secondaryFixedDim,
    "tertiary-fixed": materialTheme.schemes.light.tertiaryFixed,
    "surface-container": materialTheme.schemes.light.surfaceContainer,
    "surface-container-low": materialTheme.schemes.light.surfaceContainerLow,
  },
  fonts: {
    headline: "Aclonica",
    body: "Varela Round",
  },
  borderRadius: {
    default: "1rem",
    lg: "2rem",
    xl: "3rem",
    full: "9999px",
  },
};
