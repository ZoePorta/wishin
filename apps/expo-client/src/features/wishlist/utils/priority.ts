import { Priority } from "@wishin/domain";

import type { MD3Theme } from "react-native-paper";

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
 * Returns the theme color for a given priority level.
 *
 * @param {Priority} priority - The priority level.
 * @param {MD3Theme} theme - The Material Design 3 theme object.
 * @returns {string} The hex color from the theme.
 */
export const getPriorityColor = (
  priority: Priority,
  theme: MD3Theme,
): string => {
  switch (priority) {
    case Priority.URGENT:
    case Priority.HIGH:
      return theme.colors.error;
    case Priority.MEDIUM:
      return theme.colors.tertiary;
    default:
      return theme.colors.secondary;
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
