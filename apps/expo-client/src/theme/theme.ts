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
import materialTheme from "./material-theme.json";

/**
 * Adapt the Material Design 3 theme from the JSON export to react-native-paper format.
 */
export const theme = {
  light: {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      ...materialTheme.schemes.light,
    },
  },
  dark: {
    ...MD3DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      ...materialTheme.schemes.dark,
    },
  },
};

/**
 * Combined navigation and paper themes for seamless integration.
 */
const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

/**
 * Type guard to check if an object satisfies the MD3Theme interface.
 */
function isMD3Theme(obj: unknown): obj is MD3Theme {
  if (typeof obj !== "object" || obj === null) return false;
  const theme = obj as Record<string, unknown>;
  return (
    "colors" in theme &&
    "fonts" in theme &&
    "roundness" in theme &&
    "version" in theme &&
    "animation" in theme
  );
}

/**
 * Merges Paper and Navigation themes with custom material schemes.
 */
function mergeAndValidateTheme(
  paperTheme: MD3Theme,
  navigationTheme: typeof LightTheme,
  materialScheme: Record<string, string>,
): MD3Theme {
  const merged = {
    ...paperTheme,
    ...navigationTheme,
    colors: {
      ...paperTheme.colors,
      ...navigationTheme.colors,
      ...materialScheme,
    },
    // Ensure MD3 specific properties are preserved
    fonts: paperTheme.fonts,
    animation: paperTheme.animation,
    roundness: paperTheme.roundness,
  };

  if (!isMD3Theme(merged)) {
    throw new Error("Invalid MD3Theme generated during merge");
  }

  return merged;
}

/**
 * Provides merged light and dark theme objects for the app.
 * Combines MD3LightTheme/MD3DarkTheme with navigation themes
 * and specific material design schemes.
 * Validation occurs in mergeAndValidateTheme.
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
