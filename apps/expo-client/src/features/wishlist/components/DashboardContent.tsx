import React from "react";
import { FlatList, View, StyleSheet } from "react-native";
import { Text, Surface } from "react-native-paper";
import { type WishlistOutput, type WishlistItemOutput } from "@wishin/domain";
import { DashboardItemCard } from "./DashboardItemCard";

interface DashboardContentProps {
  wishlist: WishlistOutput;
  onRemoveItem: (id: string) => void;
  onEditItem: (item: WishlistItemOutput) => void;
}

/**
 * Main content area for the owner dashboard.
 * Displays the list of wishlist items or an empty state.
 *
 * @param {DashboardContentProps} props - The component props.
 * @param {WishlistOutput} props.wishlist - The wishlist object containing items to display.
 * @param {function} props.onRemoveItem - Callback to handle item removal.
 * @param {function} props.onEditItem - Callback to handle item editing.
 * @returns {JSX.Element} The rendered dashboard content.
 */
export const DashboardContent: React.FC<DashboardContentProps> = ({
  wishlist,
  onRemoveItem,
  onEditItem,
}) => {
  return (
    <Surface style={styles.container}>
      <FlatList
        data={wishlist.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DashboardItemCard
            item={item}
            onEdit={onEditItem}
            onRemove={onRemoveItem}
          />
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              Your wishlist is empty.
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubText}>
              Add your first item using the button below!
            </Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Space for FAB
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubText: {
    textAlign: "center",
    opacity: 0.6,
  },
});
