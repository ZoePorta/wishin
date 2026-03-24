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

declare module "react-native-paper" {
  export interface MD3Colors {
    surfaceContainerLow: string;
    surfaceContainer: string;
    surfaceContainerHigh: string;
    surfaceContainerHighest: string;
    surfaceContainerLowest: string;
    surfaceDim: string;
    surfaceBright: string;
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
};

/**
 * 2. Brand Logic Overrides
 * Targets a "Joyful" aesthetic using chromatic palettes.
 */
const brandLightOverrides = {
  ...materialTheme.schemes.light,
};

const brandDarkOverrides = {
  ...materialTheme.schemes.dark,
};

/**
 * 3. Navigation Adaptation
 */
const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

/**
 * 4. Theme Merging Logic
 */
function mergeAndValidateTheme(
  paperTheme: MD3Theme,
  navigationTheme: NavigationTheme,
  materialScheme: Partial<MD3Theme["colors"]>,
  overrides: Partial<MD3Theme["colors"]> = {},
): AppTheme {
  const finalSurface =
    overrides.surface ?? materialScheme.surface ?? paperTheme.colors.surface;

  const merged = {
    ...paperTheme,
    ...navigationTheme,
    colors: {
      ...paperTheme.colors,
      ...navigationTheme.colors,
      ...materialScheme,
      ...overrides,
      elevation: {
        ...paperTheme.colors.elevation,
        level1: finalSurface,
        level2: finalSurface,
        level3: finalSurface,
        level4: finalSurface,
        level5: finalSurface,
      },
    },
    fonts: {
      ...paperTheme.fonts,
      ...typography,
    },
    animation: paperTheme.animation,
    roundness: 2,
  };

  // Runtime assertion for required tokens
  const requiredColors = ["surface"] as const;
  const missingColors = requiredColors.filter((key) => !merged.colors[key]);

  const requiredElevations = [
    "level1",
    "level2",
    "level3",
    "level4",
    "level5",
  ] as const;
  const missingElevations = requiredElevations.filter(
    (key) => !merged.colors.elevation[key],
  );

  if (missingColors.length > 0 || missingElevations.length > 0) {
    const errorPrefix = `Theme validation failed for ${paperTheme.dark ? "dark" : "light"} scheme.`;
    const colorError =
      missingColors.length > 0
        ? ` Missing colors: ${missingColors.join(", ")}.`
        : "";
    const elevationError =
      missingElevations.length > 0
        ? ` Missing elevation levels: ${missingElevations.join(", ")}.`
        : "";
    throw new Error(`${errorPrefix}${colorError}${elevationError}`);
  }

  return merged as unknown as AppTheme;
}

/**
 * 5. Final Exports
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
    brandDarkOverrides,
  ),
};

/**
 * Fallback theme used when custom fonts fail to load.
 * Uses system fonts instead of Aclonica/Varela Round.
 */
export const fallbackTheme = {
  light: {
    ...combinedTheme.light,
    fonts: MD3LightTheme.fonts,
  },
  dark: {
    ...combinedTheme.dark,
    fonts: MD3DarkTheme.fonts,
  },
};
