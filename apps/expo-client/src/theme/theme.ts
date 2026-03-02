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

export const combinedTheme = {
  light: {
    ...MD3LightTheme,
    ...LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      ...materialTheme.schemes.light,
      ...LightTheme.colors,
    },
    // Ensure MD3 typescale is preserved to satisfy MD3Theme interface
    fonts: MD3LightTheme.fonts,
  } as unknown as MD3Theme,
  dark: {
    ...MD3DarkTheme,
    ...DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      ...materialTheme.schemes.dark,
      ...DarkTheme.colors,
    },
    // Ensure MD3 typescale is preserved to satisfy MD3Theme interface
    fonts: MD3DarkTheme.fonts,
  } as unknown as MD3Theme,
};
