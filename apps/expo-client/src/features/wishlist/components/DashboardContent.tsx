import React from "react";
import { View, Text, FlatList } from "react-native";
import { WishlistItemCard } from "./WishlistItemCard";
import { DashboardHeader } from "./DashboardHeader";
import type { WishlistOutput, WishlistItemOutput } from "@wishin/domain";

import type { WishlistStyles } from "../hooks/useWishlistStyles";

import type { createDashboardStyles } from "../styles/dashboard.styles";

interface DashboardContentProps {
  wishlist: WishlistOutput;
  styles: WishlistStyles["styles"];
  themedStyles: WishlistStyles["themedStyles"];
  dashboardStyles: ReturnType<typeof createDashboardStyles>;
  renderAddItemForm: () => React.ReactNode;
  onRemoveItem: (id: string) => void;
  onEditWishlist?: () => void;
}

export const DashboardContent: React.FC<DashboardContentProps> = ({
  wishlist,
  styles,
  themedStyles,
  dashboardStyles,
  renderAddItemForm,
  onRemoveItem,
  onEditWishlist,
}) => (
  <FlatList
    data={wishlist.items}
    keyExtractor={(item) => item.id}
    ListHeaderComponent={
      <View>
        <DashboardHeader
          wishlist={wishlist}
          styles={styles}
          themedStyles={themedStyles}
          onEdit={onEditWishlist}
        />
        {renderAddItemForm()}
        <Text style={dashboardStyles.sectionTitle}>Your Items</Text>
      </View>
    }
    renderItem={({ item }: { item: WishlistItemOutput }) => (
      <WishlistItemCard
        item={item}
        styles={styles}
        themedStyles={themedStyles}
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
