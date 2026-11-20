/**
 * Material Design 3 type scale for the app.
 * Aclonica is used for display/headline/titleLarge; Varela Round for everything else.
 *
 * Kept free of React Native imports so tooling (e.g. `scripts/generate-design-docs.ts`)
 * can read it from Node.
 */
export const typography = {
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
