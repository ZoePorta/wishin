import { StyleSheet } from "react-native";

/**
 * Common styles shared across the application.
 * Focuses on maintaining consistency in layout and accessibility.
 */
export const commonStyles = StyleSheet.create({
  /**
   * Ensuring a minimum touch target size of 44x44 points as per
   * WCAG and Material Design accessibility guidelines.
   */
  minimumTouchTarget: {
    minWidth: 44,
    minHeight: 44,
  },
});
