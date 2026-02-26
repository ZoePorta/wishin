import React from "react";
import { View, Text, Pressable } from "react-native";
import type { WishlistOutput } from "@wishin/domain";

import type { WishlistStyles } from "../hooks/useWishlistStyles";

interface DashboardHeaderProps {
  wishlist: WishlistOutput;
  styles: WishlistStyles["styles"];
  themedStyles: WishlistStyles["themedStyles"];
  onEdit?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  wishlist,
  styles,
  themedStyles,
  onEdit,
}) => (
  <View style={styles.header}>
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Text style={[styles.wishlistTitle, themedStyles.text]}>
        {wishlist.title}
      </Text>
      {onEdit && (
        <Pressable
          onPress={onEdit}
          style={{
            backgroundColor: themedStyles.surfaceMuted.backgroundColor,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
          }}
        >
          <Text
            style={{
              color: themedStyles.text.color,
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            Edit
          </Text>
        </Pressable>
      )}
    </View>
    {wishlist.description && (
      <Text style={[styles.wishlistDescription, themedStyles.textMuted]}>
        {wishlist.description}
      </Text>
    )}
    <View style={[styles.divider, themedStyles.surfaceMuted]} />
  </View>
);
