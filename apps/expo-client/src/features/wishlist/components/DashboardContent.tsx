import React from "react";
import { View, Text, FlatList } from "react-native";
import { DashboardItemCard } from "./DashboardItemCard";
import type { WishlistOutput, WishlistItemOutput } from "@wishin/domain";

import type { WishlistStyles } from "../hooks/useWishlistStyles";

import type { createDashboardStyles } from "../styles/dashboard.styles";

interface DashboardContentProps {
  wishlist: WishlistOutput;
  styles: WishlistStyles["styles"];
  themedStyles: WishlistStyles["themedStyles"];
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
  themedStyles,
  dashboardStyles,
  onRemoveItem,
  onEditItem,
}) => {
  return (
    <FlatList
      data={wishlist.items}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text accessibilityRole="header" style={dashboardStyles.sectionTitle}>
            Your Items
          </Text>
        </View>
      }
      renderItem={({ item }: { item: WishlistItemOutput }) => (
        <DashboardItemCard
          item={item}
          styles={styles}
          themedStyles={themedStyles}
          onEdit={onEditItem}
          onRemove={onRemoveItem}
        />
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, themedStyles.textMuted]}>
            You haven't added any items yet.
          </Text>
        </View>
      }
    />
  );
};
