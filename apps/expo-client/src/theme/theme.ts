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

import "react-native-paper";
import { addAlpha } from "../utils/colors";

declare module "react-native-paper" {
  export interface MD3Colors {
    surfaceContainerLow: string;
    surfaceContainer: string;
    surfaceContainerHigh: string;
    surfaceContainerHighest: string;
    surfaceContainerLowest: string;
    surfaceDim: string;
    surfaceBright: string;
    surfaceGlass: string;
    primaryFixed: string;
    onPrimaryFixed: string;
    secondaryFixed: string;
    onSecondaryFixed: string;
    tertiaryFixed: string;
    onTertiaryFixed: string;
  }
}

/**
 * Extension of the React Native Paper MD3Theme that includes
 * additional Material Design 3 surface container color tokens.
 *
 * This interface ensures that the theme used throughout the application
 * provides the standard MD3 elevation levels and surface variants.
 */
export interface AppTheme extends MD3Theme {
  colors: MD3Theme["colors"] & {
    /**
     * Used for content on surfaces with the lowest emphasis.
     */
    surfaceContainerLow: string;
    /**
     * The standard container color for content.
     */
    surfaceContainer: string;
    /**
     * Used for content on surfaces with high emphasis.
     */
    surfaceContainerHigh: string;
    /**
     * Used for content on surfaces with the highest emphasis.
     */
    surfaceContainerHighest: string;
    /**
     * Used for content on surfaces with the lowest emphasis (lower than Low).
     */
    surfaceContainerLowest: string;
    /**
     * A darker variant of the surface color.
     */
    surfaceDim: string;
    /**
     * A brighter variant of the surface color.
     */
    surfaceBright: string;
    /**
     * A semi-transparent surface color for glass/blur effects.
     */
    surfaceGlass: string;
    /** Fixed-tone primary color for non-interactive or high-contrast backgrounds. */
    primaryFixed: string;
    /** Foreground color for content on primaryFixed surfaces. */
    onPrimaryFixed: string;
    /** Fixed-tone secondary color for non-interactive or high-contrast backgrounds. */
    secondaryFixed: string;
    /** Foreground color for content on secondaryFixed surfaces. */
    onSecondaryFixed: string;
    /** Fixed-tone tertiary color for non-interactive or high-contrast backgrounds. */
    tertiaryFixed: string;
    /** Foreground color for content on tertiaryFixed surfaces. */
    onTertiaryFixed: string;
  };
  fonts: MD3Theme["fonts"] & {
    titleLargeVarela: MD3Theme["fonts"]["titleLarge"];
  };
}

/**
 * 1. Typography Configuration
 * Uses Aclonica for headlines and Varela Round for body/labels.
 */
const typography = {
  displayLarge: {
    fontFamily: "Aclonica_400Regular",
    fontSize: 57,
    lineHeight: 80,
    letterSpacing: 0,
    fontWeight: "400" as const,
  },
  displayMedium: {
    fontFamily: "Aclonica_400Regular",
    fontSize: 45,
    lineHeight: 52,
    letterSpacing: 0,
    fontWeight: "400" as const,
  },
  displaySmall: {
    fontFamily: "Aclonica_400Regular",
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: 0,
    fontWeight: "400" as const,
  },
  headlineLarge: {
    fontFamily: "Aclonica_400Regular",
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: 0,
    fontWeight: "400" as const,
  },
  headlineMedium: {
    fontFamily: "Aclonica_400Regular",
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: 0,
    fontWeight: "400" as const,
  },
  headlineSmall: {
    fontFamily: "Aclonica_400Regular",
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 0,
    fontWeight: "400" as const,
  },
  titleLarge: {
    fontFamily: "Aclonica_400Regular",
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
    fontWeight: "400" as const,
  },
  titleMedium: {
    fontFamily: "VarelaRound_400Regular",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.15,
    fontWeight: "400" as const,
  },
  titleSmall: {
    fontFamily: "VarelaRound_400Regular",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
    fontWeight: "400" as const,
  },
  labelLarge: {
    fontFamily: "VarelaRound_400Regular",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
    fontWeight: "400" as const,
  },
  labelMedium: {
    fontFamily: "VarelaRound_400Regular",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
    fontWeight: "400" as const,
  },
  labelSmall: {
    fontFamily: "VarelaRound_400Regular",
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.5,
    fontWeight: "400" as const,
  },
  bodyLarge: {
    fontFamily: "VarelaRound_400Regular",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.15,
    fontWeight: "400" as const,
  },
  bodyMedium: {
    fontFamily: "VarelaRound_400Regular",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.25,
    fontWeight: "400" as const,
  },
  bodySmall: {
    fontFamily: "VarelaRound_400Regular",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
    fontWeight: "400" as const,
  },
  titleLargeVarela: {
    fontFamily: "VarelaRound_400Regular",
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
    fontWeight: "400" as const,
  },
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
 */
/**
 * Merges the React Native Paper theme, Navigation theme, and a partial Material color scheme
 * into a single unified AppTheme.
 *
 * This function also performs runtime validation to ensure all required surface container
 * and variant tokens are present. It provides fallback behavior for missing surface tokens
 * by using the primary surface color and computes `surfaceGlass` using {@link addAlpha}.
 *
 * @param {MD3Theme} paperTheme - The base React Native Paper Material Design 3 theme.
 * @param {NavigationTheme} navigationTheme - The React Navigation theme to merge.
 * @param {Partial<MD3Theme["colors"]>} materialScheme - The Material Design color scheme (from dynamic colors or JSON).
 * @returns {AppTheme} The merged and validated application theme.
 * @throws {Error} If any required color tokens (e.g., surfaceContainerLow, surfaceDim) are missing after merging.
 */
function mergeAndValidateTheme(
  paperTheme: MD3Theme,
  navigationTheme: NavigationTheme,
  materialScheme: Partial<MD3Theme["colors"]>,
): AppTheme {
  const finalSurface = materialScheme.surface ?? paperTheme.colors.surface;

  const merged: AppTheme = {
    ...paperTheme,
    ...navigationTheme,
    colors: {
      ...paperTheme.colors,
      ...navigationTheme.colors,
      ...materialScheme,
      // Explicitly pull surface container tokens to satisfy AppTheme interface
      surfaceContainerLow:
        (materialScheme as Record<string, string | undefined>)
          .surfaceContainerLow ?? finalSurface,
      surfaceContainer:
        (materialScheme as Record<string, string | undefined>)
          .surfaceContainer ?? finalSurface,
      surfaceContainerHigh:
        (materialScheme as Record<string, string | undefined>)
          .surfaceContainerHigh ?? finalSurface,
      surfaceContainerHighest:
        (materialScheme as Record<string, string | undefined>)
          .surfaceContainerHighest ?? finalSurface,
      surfaceContainerLowest:
        (materialScheme as Record<string, string | undefined>)
          .surfaceContainerLowest ?? finalSurface,
      surfaceDim:
        (materialScheme as Record<string, string | undefined>).surfaceDim ??
        finalSurface,
      surfaceBright:
        (materialScheme as Record<string, string | undefined>).surfaceBright ??
        finalSurface,
      surfaceGlass: addAlpha(finalSurface, 0.5),
      primaryFixed:
        (materialScheme as Record<string, string | undefined>).primaryFixed ??
        paperTheme.colors.primaryContainer,
      onPrimaryFixed:
        (materialScheme as Record<string, string | undefined>).onPrimaryFixed ??
        paperTheme.colors.onPrimaryContainer,
      secondaryFixed:
        (materialScheme as Record<string, string | undefined>).secondaryFixed ??
        paperTheme.colors.secondaryContainer,
      onSecondaryFixed:
        (materialScheme as Record<string, string | undefined>)
          .onSecondaryFixed ?? paperTheme.colors.onSecondaryContainer,
      tertiaryFixed:
        (materialScheme as Record<string, string | undefined>).tertiaryFixed ??
        paperTheme.colors.tertiaryContainer,
      onTertiaryFixed:
        (materialScheme as Record<string, string | undefined>)
          .onTertiaryFixed ?? paperTheme.colors.onTertiaryContainer,
    },
    fonts: {
      ...paperTheme.fonts,
      ...typography,
    },
    animation: paperTheme.animation,
    roundness: 4, // Increased for a more "Joyful" aesthetic (pill-shaped buttons)
  };

  // Runtime assertion for required tokens
  const requiredColors = [
    "surface",
    "surfaceContainerLow",
    "surfaceContainer",
    "surfaceContainerHigh",
    "surfaceContainerHighest",
    "surfaceContainerLowest",
    "surfaceDim",
    "surfaceBright",
    "surfaceGlass",
  ] as const;
  const missingColors = requiredColors.filter(
    (key) => !merged.colors[key as keyof typeof merged.colors],
  );

  if (missingColors.length > 0) {
    const errorPrefix = `Theme validation failed for ${paperTheme.dark ? "dark" : "light"} scheme.`;
    const colorError = ` Missing colors: ${missingColors.join(", ")}.`;
    throw new Error(`${errorPrefix}${colorError}`);
  }

  return merged;
}

/**
 * 4. Final Exports
 */
export const combinedTheme = {
  light: mergeAndValidateTheme(
    MD3LightTheme,
    LightTheme,
    materialTheme.schemes.light,
  ),
  dark: mergeAndValidateTheme(
    MD3DarkTheme,
    DarkTheme,
    materialTheme.schemes.dark,
  ),
};

/**
 * Fallback theme used when custom fonts (Aclonica/Varela Round) fail to load.
 *
 * The spread order in the fonts object is intentional:
 * 1. `...typography`: Standard application typography configuration.
 * 2. `...MD3LightTheme.fonts` / `...MD3DarkTheme.fonts`: Default MD3 system fonts
 *    override custom font families with system fallbacks to ensure readability.
 * 3. `titleLargeVarela`: Explicitly set after both spreads to ensure this specific
 *    variant (using Varela Round fallback) is preserved.
 *
 * This ensures that if the custom font assets aren't available, the app gracefully
 * reverts to native system fonts while maintaining the intended hierarchy.
 */
export const fallbackTheme: { light: AppTheme; dark: AppTheme } = {
  light: {
    ...combinedTheme.light,
    fonts: {
      ...typography,
      ...MD3LightTheme.fonts,
      titleLargeVarela: MD3LightTheme.fonts.titleLarge,
    },
  },
  dark: {
    ...combinedTheme.dark,
    fonts: {
      ...typography,
      ...MD3DarkTheme.fonts,
      titleLargeVarela: MD3DarkTheme.fonts.titleLarge,
    },
  },
};
