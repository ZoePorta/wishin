import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import type { WishlistOutput } from "@wishin/domain";

import type { WishlistStyles } from "../hooks/useWishlistStyles";

interface DashboardHeaderProps {
  wishlist: WishlistOutput;
  commonStyles: WishlistStyles["styles"];
  themedStyles: WishlistStyles["themedStyles"];
  onEdit?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  wishlist,
  commonStyles,
  themedStyles,
  onEdit,
}) => {
  const styles = StyleSheet.create({
    containerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    leftBlock: {
      ...commonStyles.wishlistTitle,
      color: themedStyles.text.color,
    },
    rightBlock: {
      backgroundColor: themedStyles.surfaceMuted.backgroundColor,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    editButtonText: {
      color: themedStyles.text.color,
      fontSize: 14,
      fontWeight: "600",
    },
  });

  return (
    <View style={commonStyles.header}>
      <View style={styles.containerRow}>
        <Text accessibilityRole="header" style={styles.leftBlock}>
          {wishlist.title}
        </Text>
        {onEdit && (
          <Pressable
            onPress={onEdit}
            accessibilityLabel="Edit wishlist"
            accessibilityRole="button"
            style={styles.rightBlock}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
        )}
      </View>
      {wishlist.description && (
        <Text
          style={[commonStyles.wishlistDescription, themedStyles.textMuted]}
        >
          {wishlist.description}
        </Text>
      )}
      <View style={[commonStyles.divider, themedStyles.surfaceMuted]} />
    </View>
  );
};
