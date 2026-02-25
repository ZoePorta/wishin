import { StyleSheet } from "react-native";
import type { AppTheme } from "../../../constants/Colors";
import { Spacing } from "../../../constants/Spacing";
import { Typography } from "../../../constants/Typography";

export const createWishlistFormStyles = (theme: AppTheme) =>
  StyleSheet.create({
    label: {
      fontSize: Typography.size.md,
      fontWeight: Typography.weight.semibold,
      marginBottom: Spacing.sm,
      marginTop: Spacing.lg,
      color: theme.text,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.surfaceMuted,
      borderRadius: 8,
      padding: Spacing.md,
      fontSize: Typography.size.md,
      color: theme.text,
      backgroundColor: theme.card,
    },
    textArea: {
      height: 100,
      textAlignVertical: "top",
    },
    submitButton: {
      backgroundColor: theme.primary,
      borderRadius: 8,
      padding: Spacing.lg,
      alignItems: "center",
      marginTop: Spacing.xxxl,
      marginBottom: Spacing.xl,
    },
    submitButtonDisabled: {
      backgroundColor: theme.surfaceMuted,
    },
    submitButtonText: {
      color: theme.card,
      fontSize: Typography.size.lg,
      fontWeight: Typography.weight.bold,
    },
  });
