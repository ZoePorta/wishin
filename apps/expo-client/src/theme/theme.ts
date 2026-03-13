import {
  MD3LightTheme,
  MD3DarkTheme,
  adaptNavigationTheme,
  MD3Theme,
} from "react-native-paper";
import {
  DefaultTheme as NavigationDefaultTheme,
  DarkTheme as NavigationDarkTheme,
} from "@react-navigation/native";
import type { Theme as NavigationTheme } from "@react-navigation/native";
import materialTheme from "./material-theme.json";

/**
 * 1. Brand Logic Overrides
 * Targets a "Joyful" aesthetic using chromatic palettes.
 */
const brandLightOverrides = {
  // Soft lavender for the main background
  background: materialTheme.palettes.secondary[95],

  // Pure white for surfaces to make cards stand out
  surface: materialTheme.palettes.neutral[100],

  // Saturated pink for primary actions
  primary: materialTheme.palettes.primary[50],
  onPrimary: materialTheme.palettes.primary[100],

  // Pastel variants for inputs and containers
  surfaceVariant: materialTheme.palettes.primary[95],
  secondaryContainer: materialTheme.palettes.secondary[90],

  // UI details and outlines
  outline: materialTheme.palettes.secondary[80],
  onSurfaceVariant: materialTheme.palettes.secondary[30],
};

/**
 * 2. Navigation Adaptation
 */
const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

/**
 * 3. Theme Merging Logic
 * Deeply merges Paper, Navigation and Material schemes.
 * Order: Paper -> Navigation -> Material Scheme -> Brand Overrides
 */
/**
 * Merges MD3 Paper, Navigation, and Material schemes into a final application theme.
 *
 * @param paperTheme - The base MD3 Paper theme (Light or Dark).
 * @param navigationTheme - The adapted Navigation theme.
 * @param materialScheme - Raw Material Design 3 color tokens from JSON.
 * @param overrides - High-priority brand color overrides.
 *
 * @remarks
 * Merge Precedence: Paper < Navigation < Material Scheme < Overrides.
 * This function also forces elevation tokens to match the resolve surface color
 * to prevent MD3's automatic tinting for elevated cards.
 *
 * @returns {MD3Theme} The fully merged and validated theme object.
 */
function mergeAndValidateTheme(
  paperTheme: MD3Theme,
  navigationTheme: NavigationTheme,
  materialScheme: Partial<MD3Theme["colors"]>,
  overrides: Partial<MD3Theme["colors"]> = {},
): MD3Theme {
  const finalSurface =
    overrides.surface ?? materialScheme.surface ?? paperTheme.colors.surface;

  const merged = {
    ...paperTheme,
    ...navigationTheme,
    colors: {
      ...paperTheme.colors,
      ...navigationTheme.colors,
      ...materialScheme, // Raw M3 Schemes from JSON
      ...overrides, // FINAL AUTHORITY: Your Joyful/Friendly overrides
      elevation: {
        ...paperTheme.colors.elevation,
        // Override all elevation levels to use the intended surface color.
        // This prevents MD3 from applying automatic tint overlays that
        // make white surfaces look gray.
        level1: finalSurface,
        level2: finalSurface,
        level3: finalSurface,
        level4: finalSurface,
        level5: finalSurface,
      },
    },
    // Preserve MD3 typography and structure
    fonts: paperTheme.fonts,
    animation: paperTheme.animation,
    roundness: paperTheme.roundness,
  };

  return merged as MD3Theme;
}

/**
 * 4. Final Exports
 */
export const combinedTheme = {
  light: mergeAndValidateTheme(
    MD3LightTheme,
    LightTheme,
    materialTheme.schemes.light,
    brandLightOverrides,
  ),
  dark: mergeAndValidateTheme(
    MD3DarkTheme,
    DarkTheme,
    materialTheme.schemes.dark,
    {}, // Add dark overrides here if needed
  ),
};
