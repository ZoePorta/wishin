import React from "react";
import { View, FlatList } from "react-native";
import { Text } from "react-native-paper";
import { DashboardItemCard } from "./DashboardItemCard";
import type { WishlistOutput, WishlistItemOutput } from "@wishin/domain";

import type { WishlistStyles } from "../hooks/useWishlistStyles";
import type { createDashboardStyles } from "../styles/dashboard.styles";

interface DashboardContentProps {
  wishlist: WishlistOutput;
  styles: WishlistStyles["styles"];
  dashboardStyles: ReturnType<typeof createDashboardStyles>;
  onRemoveItem: (id: string) => void;
  onEditItem: (item: WishlistItemOutput) => void;
}

/**
 * Renders the core content of the owner dashboard, including the list of wishlist items.
 *
 * @param {DashboardContentProps} props - The component props.
 * @param {WishlistOutput} props.wishlist - The wishlist aggregate data.
 * @param {WishlistStyles["styles"]} props.styles - Shared wishlist styles.
 * @param {WishlistStyles["themedStyles"]} props.themedStyles - Themed styles for the wishlist.
 * @param {ReturnType<typeof createDashboardStyles>} props.dashboardStyles - Specific styles for the dashboard layout.
 * @param {(id: string) => void} props.onRemoveItem - Callback function to remove an item.
 * @param {(item: WishlistItemOutput) => void} props.onEditItem - Callback function to edit an item.
 * @returns {JSX.Element} The rendered dashboard content.
 */
export const DashboardContent: React.FC<DashboardContentProps> = ({
  wishlist,
  styles,
  dashboardStyles,
  onRemoveItem,
  onEditItem,
}) => {
  return (
    <FlatList
      data={wishlist.items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={dashboardStyles.container}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text variant="headlineMedium" style={dashboardStyles.sectionTitle}>
            Your Items
          </Text>
        </View>
      }
      renderItem={({ item }: { item: WishlistItemOutput }) => (
        <DashboardItemCard
          item={item}
          commonStyles={styles}
          onEdit={onEditItem}
          onRemove={onRemoveItem}
        />
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text variant="bodyMedium" style={styles.emptyText}>
            You haven't added any items yet.
          </Text>
        </View>
      }
    />
  );
};
