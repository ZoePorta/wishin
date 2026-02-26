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
