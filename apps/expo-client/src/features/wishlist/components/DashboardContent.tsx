import React from "react";
import { FlatList, View, StyleSheet } from "react-native";
import { Text, Surface } from "react-native-paper";
import { type WishlistOutput, type WishlistItemOutput } from "@wishin/domain";
import { DashboardItemCard } from "./DashboardItemCard";
import { ItemSortSelector } from "./ItemSortSelector";
import {
  DEFAULT_ITEM_SORT,
  sortItems,
  type ItemSortOption,
} from "../utils/item-sort";
import { Layout } from "../../../constants/Layout";
import {
  PullToRefresh,
  useNativeRefreshControl,
} from "../../../components/common/PullToRefresh";
import { useTranslation } from "react-i18next";

interface DashboardContentProps {
  wishlist: WishlistOutput;
  onRemoveItem: (id: string) => void;
  onEditItem: (item: WishlistItemOutput) => void;
  onItemPress: (item: WishlistItemOutput) => void;
  ListHeaderComponent?: React.ReactElement | null;
  /** Whether a pull-to-refresh is in progress. */
  refreshing: boolean;
  /** Called when the user pulls the list down to refresh it. */
  onRefresh: () => void;
}

/**
 * Main content area for the owner dashboard.
 * Displays the list of wishlist items or an empty state.
 *
 * @param {DashboardContentProps} props - The component props.
 * @param {WishlistOutput} props.wishlist - The wishlist object containing items to display.
 * @param {function} props.onRemoveItem - Callback to handle item removal.
 * @param {function} props.onEditItem - Callback to handle item editing.
 * @param {function} props.onItemPress - Callback invoked when an item is pressed.
 * @param {React.ReactElement | null} [props.ListHeaderComponent] - Optional header element rendered at the top of the list.
 * @param {boolean} props.refreshing - Whether a pull-to-refresh is in progress.
 * @param {function} props.onRefresh - Callback invoked when the user pulls to refresh.
 * @returns {JSX.Element} The rendered dashboard content.
 */
export const DashboardContent: React.FC<DashboardContentProps> = ({
  wishlist,
  onRemoveItem,
  onEditItem,
  onItemPress,
  ListHeaderComponent,
  refreshing,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const listRef = React.useRef<FlatList<WishlistItemOutput>>(null);
  const refreshControl = useNativeRefreshControl(refreshing, onRefresh);
  const [sortBy, setSortBy] = React.useState<ItemSortOption>(DEFAULT_ITEM_SORT);
  const sortedItems = React.useMemo(
    () => sortItems(wishlist.items, sortBy),
    [wishlist.items, sortBy],
  );

  const header = (
    <>
      {ListHeaderComponent}
      {wishlist.items.length > 1 && (
        <ItemSortSelector value={sortBy} onChange={setSortBy} />
      )}
    </>
  );

  return (
    <Surface style={styles.container}>
      <PullToRefresh
        refreshing={refreshing}
        onRefresh={onRefresh}
        scrollRef={listRef}
      >
        <FlatList
          ref={listRef}
          data={sortedItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DashboardItemCard
              item={item}
              onEdit={onEditItem}
              onRemove={onRemoveItem}
              onPress={onItemPress}
            />
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge" style={styles.emptyText}>
                {t("dashboard.emptyTitle")}
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubText}>
                {t("dashboard.emptySubtitle")}
              </Text>
            </View>
          )}
          ListHeaderComponent={header}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        />
      </PullToRefresh>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: Layout.pagePadding,
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
