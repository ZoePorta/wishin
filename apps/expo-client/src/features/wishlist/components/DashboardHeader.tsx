import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Surface } from "react-native-paper";
import { type WishlistOutput } from "@wishin/domain";

interface DashboardHeaderProps {
  wishlist: WishlistOutput;
}

/**
 * Renders the header for the owner dashboard.
 * Uses Material Design 3 components.
 *
 * @param {DashboardHeaderProps} props - The component props.
 * @param {WishlistOutput} props.wishlist - The wishlist object whose title and description are shown.
 * @returns {JSX.Element} The rendered dashboard header.
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  wishlist,
}) => {
  return (
    <Surface style={styles.container}>
      <View style={styles.leftBlock}>
        <Text variant="headlineMedium" style={styles.title}>
          {wishlist.title}
        </Text>
        {wishlist.description && (
          <Text variant="bodyMedium" style={styles.description}>
            {wishlist.description}
          </Text>
        )}
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    paddingBottom: 8,
  },
  leftBlock: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontWeight: "bold",
  },
  description: {
    marginTop: 4,
    opacity: 0.7,
  },
});
