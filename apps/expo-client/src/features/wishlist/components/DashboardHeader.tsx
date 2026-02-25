import React from "react";
import { View, Text } from "react-native";
import type { WishlistOutput } from "@wishin/domain";

import type { WishlistStyles } from "../hooks/useWishlistStyles";

interface DashboardHeaderProps {
  wishlist: WishlistOutput;
  styles: WishlistStyles["styles"];
  themedStyles: WishlistStyles["themedStyles"];
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  wishlist,
  styles,
  themedStyles,
}) => (
  <View style={styles.header}>
    <Text style={[styles.wishlistTitle, themedStyles.text]}>
      {wishlist.title}
    </Text>
    {wishlist.description && (
      <Text style={[styles.wishlistDescription, themedStyles.textMuted]}>
        {wishlist.description}
      </Text>
    )}
    <View style={[styles.divider, themedStyles.surfaceMuted]} />
  </View>
);
