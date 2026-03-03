import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, IconButton, Surface } from "react-native-paper";
import { type WishlistOutput } from "@wishin/domain";

interface DashboardHeaderProps {
  wishlist: WishlistOutput;
  onEdit?: () => void;
}

/**
 * Renders the header for the owner dashboard.
 * Uses Material Design 3 components.
 *
 * @param {DashboardHeaderProps} props - The component props.
 * @param {WishlistOutput} props.wishlist - The wishlist object whose title and description are shown.
 * @param {function} [props.onEdit] - Optional callback to trigger the edit wishlist modal.
 * @returns {JSX.Element} The rendered dashboard header.
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  wishlist,
  onEdit,
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
      {onEdit && (
        <IconButton
          icon="pencil"
          mode="contained-tonal"
          onPress={onEdit}
          accessibilityLabel="Edit wishlist details"
        />
      )}
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
