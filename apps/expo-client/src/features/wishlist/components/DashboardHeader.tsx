import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, Divider } from "react-native-paper";
import type { WishlistOutput } from "@wishin/domain";
import type { WishlistStyles } from "../hooks/useWishlistStyles";

interface DashboardHeaderProps {
  wishlist: WishlistOutput;
  commonStyles: WishlistStyles["styles"];
  themedStyles: WishlistStyles["themedStyles"];
  onEdit?: () => void;
}

/**
 * Renders the header for the owner dashboard.
 * Uses Material Design 3 components.
 *
 * @param {DashboardHeaderProps} props - The component props.
 * @param {WishlistOutput} props.wishlist - The wishlist data to display.
 * @param {WishlistStyles["styles"]} props.commonStyles - Shared styles used across the dashboard.
 * @param {WishlistStyles["themedStyles"]} props.themedStyles - Theme-specific styles.
 * @param {() => void} [props.onEdit] - Optional callback for when the edit button is pressed.
 * @returns {JSX.Element} The rendered header.
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  wishlist,
  commonStyles,
  onEdit,
}) => {
  return (
    <View style={commonStyles.header}>
      <View style={styles.headerRow}>
        <Text variant="headlineMedium" style={styles.title}>
          {wishlist.title}
        </Text>
        {onEdit && (
          <Button
            mode="outlined"
            onPress={onEdit}
            accessibilityLabel="Edit wishlist"
            style={styles.button}
          >
            Edit
          </Button>
        )}
      </View>
      {wishlist.description && (
        <Text variant="bodyMedium" style={styles.description}>
          {wishlist.description}
        </Text>
      )}
      <Divider style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    flex: 1,
  },
  description: {
    marginTop: 8,
  },
  divider: {
    marginTop: 16,
  },
  button: {
    marginLeft: 8,
  },
});
