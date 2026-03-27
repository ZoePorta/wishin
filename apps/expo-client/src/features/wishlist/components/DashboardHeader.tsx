import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Text, Divider } from "react-native-paper";
import { type WishlistOutput } from "@wishin/domain";
import { Layout } from "../../../constants/Layout";

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
    <View style={styles.container}>
      <View style={styles.leftBlock}>
        <Text variant="headlineMedium" style={styles.title}>
          {wishlist.title}
        </Text>
        {wishlist.description && (
          <Text variant="bodyLarge" style={styles.description}>
            {wishlist.description}
          </Text>
        )}
        <Divider style={styles.divider} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
    marginTop: Platform.OS === "web" ? Layout.headerHeightWeb : 0,
  },
  leftBlock: {
    flex: 1,
  },
  title: {
    fontWeight: "700",
  },
  description: {
    marginTop: 8,
    lineHeight: 24,
  },
  divider: {
    marginTop: 24,
  },
});
