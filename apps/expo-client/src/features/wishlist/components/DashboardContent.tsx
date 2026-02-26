import React from "react";
import { View, Text, FlatList, Pressable } from "react-native";
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
      <View>
        <WishlistItemCard
          item={item}
          styles={styles}
          themedStyles={themedStyles}
        />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            marginTop: -12,
            marginBottom: 16,
            paddingRight: 8,
          }}
        >
          <Pressable
            onPress={() => {
              onRemoveItem(item.id);
            }}
            style={dashboardStyles.removeButton}
          >
            <Text style={dashboardStyles.removeButtonText}>Remove</Text>
          </Pressable>
        </View>
      </View>
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
