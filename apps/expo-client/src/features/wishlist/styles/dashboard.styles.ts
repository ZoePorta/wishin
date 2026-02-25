import { StyleSheet } from "react-native";
import type { AppTheme } from "../../../constants/Colors";
import { Spacing } from "../../../constants/Spacing";
import { Typography } from "../../../constants/Typography";

export const createDashboardStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: Spacing.lg,
    },
    sectionTitle: {
      fontSize: Typography.size.xxl,
      fontWeight: Typography.weight.bold,
      marginBottom: Spacing.lg,
      marginTop: Spacing.xxl,
      color: theme.text,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
    },
    removeButton: {
      backgroundColor: theme.red100,
      padding: Spacing.sm,
      borderRadius: 6,
    },
    removeButtonText: {
      color: "#7F1D1D", // Dark red
      fontWeight: Typography.weight.semibold,
      fontSize: Typography.size.sm,
    },
  });
