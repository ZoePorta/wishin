/**
 * Centralized typography constants for consistent text styling.
 */
export const Typography = {
  size: {
    /** 10px */
    xs: 10,
    /** 12px */
    sm: 12,
    /** 14px */
    base: 14,
    /** 16px */
    md: 16,
    /** 18px */
    lg: 18,
    /** 20px */
    xl: 20,
    /** 22px */
    xxl: 22,
    /** 24px */
    xxxl: 24,
    /** 32px */
    huge: 32,
    /** 48px */
    massive: 48,
  },
  weight: {
    /** '400' */
    regular: "400" as const,
    /** '500' */
    medium: "500" as const,
    /** '600' */
    semibold: "600" as const,
    /** '700' */
    bold: "700" as const,
    /** '900' */
    black: "900" as const,
  },
  lineHeight: {
    /** 1.2 */
    tight: 1.2,
    /** 1.5 */
    normal: 1.5,
    /** 1.8 */
    relaxed: 1.8,
  },
} as const;
