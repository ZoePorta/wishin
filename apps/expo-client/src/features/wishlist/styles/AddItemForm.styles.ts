import { StyleSheet } from "react-native";
import type { AppTheme } from "../../../constants/Colors";
import { Spacing } from "../../../constants/Spacing";
import { Typography } from "../../../constants/Typography";

/**
 * Creates the styles for the AddItemForm component using the provided theme.
 *
 * @param {AppTheme} theme - The application theme object containing color definitions.
 * @returns {ReturnType<typeof StyleSheet.create>} A StyleSheet object containing all styles for the AddItemForm.
 */
export const createAddItemFormStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      padding: Spacing.lg,
      backgroundColor: theme.card,
      borderRadius: 12,
      marginBottom: Spacing.xl,
      borderWidth: 1,
      borderColor: theme.surfaceMuted,
    },
    title: {
      fontSize: Typography.size.xl,
      fontWeight: Typography.weight.bold,
      marginBottom: Spacing.lg,
      color: theme.text,
    },
    label: {
      fontSize: Typography.size.base,
      fontWeight: Typography.weight.semibold,
      marginBottom: Spacing.xs,
      marginTop: Spacing.md,
      color: theme.text,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.surfaceMuted,
      borderRadius: 8,
      padding: Spacing.md,
      fontSize: Typography.size.base,
      color: theme.text,
      backgroundColor: theme.background,
    },
    inputDisabled: {
      backgroundColor: theme.surfaceMuted,
      color: theme.textMuted,
    },
    multilineInput: {
      height: 80,
      textAlignVertical: "top",
    },
    row: {
      flexDirection: "row",
      gap: Spacing.md,
    },
    flex1: {
      flex: 1,
    },
    priorityGroup: {
      flexDirection: "row",
      marginTop: Spacing.xs,
      gap: Spacing.sm,
    },
    priorityButton: {
      flex: 1,
      paddingVertical: Spacing.sm,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.surfaceMuted,
      alignItems: "center",
    },
    priorityActive: {
      borderColor: theme.primary,
      backgroundColor: theme.sky100,
    },
    priorityText: {
      fontSize: Typography.size.sm,
      color: theme.textMuted,
    },
    priorityTextActive: {
      color: theme.primary,
      fontWeight: Typography.weight.bold,
    },
    submitButton: {
      backgroundColor: theme.primary,
      borderRadius: 8,
      padding: Spacing.md,
      alignItems: "center",
      marginTop: Spacing.xl,
    },
    submitButtonDisabled: {
      backgroundColor: theme.surfaceMuted,
    },
    submitButtonText: {
      color: theme.card,
      fontSize: Typography.size.md,
      fontWeight: Typography.weight.bold,
    },
    checkboxContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: Spacing.xs, // Reduced from sm because checkbox container has internal padding
      marginLeft: -12, // Offset the extra touch area to align visually with labels
    },
    checkbox: {
      width: 44,
      height: 44,
      justifyContent: "center",
      alignItems: "center",
    },
    checkboxVisual: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: theme.surfaceMuted,
      justifyContent: "center",
      alignItems: "center",
    },
    checkboxVisualChecked: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    checkboxLabel: {
      fontSize: Typography.size.base,
      color: theme.text,
    },
    checkmark: {
      width: 10,
      height: 10,
      backgroundColor: theme.card,
      borderRadius: 2,
    },
  });
