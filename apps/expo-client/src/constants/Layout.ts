import type { DimensionValue } from "react-native";

/**
 * Layout constants for the application.
 */
export const Layout = {
  /**
   * Height of the web header in pixels.
   * Used for calculating top margins and scroll offsets.
   */
  headerHeightWeb: 70,
  /**
   * Maximum width of a single item in the grid.
   */
  gridItemMaxWidth: 500,
  /**
   * Padding between grid items.
   */
  gridItemPadding: 10,
  /**
   * Standard padding for pages to provide breathing room under the header
   * and consistent horizontal alignment.
   */
  pagePadding: 20,
  /**
   * Responsive column widths for the grid.
   */
  columnWidths: {
    1: "100%",
    2: "50%",
    3: "33.33%",
    4: "25%",
  } as const satisfies Record<1 | 2 | 3 | 4, DimensionValue>,
};
