import { Priority } from "@wishin/domain";
import type { MD3Theme } from "react-native-paper";
import { type AppTheme } from "../../../theme/theme";

/**
 * Display labels for priority levels.
 * Decoupled from the domain enum to allow for internationalization and presentation changes.
 */
export const PRIORITY_LABELS: Record<Priority, string> = {
  [Priority.LOW]: "LOW",
  [Priority.MEDIUM]: "MEDIUM",
  [Priority.HIGH]: "HIGH",
  [Priority.URGENT]: "URGENT",
};

/**
 * Returns the theme colors for a given priority level.
 *
 * @param {Priority} priority - The priority level.
 * @param {MD3Theme} theme - The Material Design 3 theme object.
 * @returns {{ background: string; foreground: string }} The background and foreground colors.
 */
export const getPriorityColors = (
  priority: Priority,
  theme: MD3Theme,
): { background: string; foreground: string } => {
  const appTheme = theme as AppTheme;
  switch (priority) {
    case Priority.URGENT:
      return {
        background: appTheme.colors.errorContainer,
        foreground: appTheme.colors.onErrorContainer,
      };
    case Priority.HIGH:
      return {
        background: appTheme.colors.primaryFixed,
        foreground: appTheme.colors.onPrimaryFixed,
      };
    case Priority.MEDIUM:
      return {
        background: appTheme.colors.secondaryContainer,
        foreground: appTheme.colors.onSecondaryContainer,
      };
    case Priority.LOW:
    default:
      return {
        background: appTheme.colors.tertiaryFixed,
        foreground: appTheme.colors.onTertiaryFixed,
      };
  }
};

/**
 * Priorities sorted by importance for consistent iteration in UI components.
 */
export const SORTED_PRIORITIES: Priority[] = [
  Priority.LOW,
  Priority.MEDIUM,
  Priority.HIGH,
  Priority.URGENT,
];
