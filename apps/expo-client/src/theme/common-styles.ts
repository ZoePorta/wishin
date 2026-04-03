import { StyleSheet, Platform } from "react-native";
import { Layout } from "../constants/Layout";

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
  /**
   * Common container style for modals to ensure they are centered
   * and respect the fixed header on web.
   */
  modalContent: {
    marginTop: Platform.OS === "web" ? Layout.headerHeightWeb : 0,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },
});
