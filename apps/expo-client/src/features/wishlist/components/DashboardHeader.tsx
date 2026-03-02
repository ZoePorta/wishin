import React from "react";
import { View } from "react-native";
import { Text, Button, Divider } from "react-native-paper";
import type { WishlistOutput } from "@wishin/domain";
import type { WishlistStyles } from "../hooks/useWishlistStyles";

interface DashboardHeaderProps {
  wishlist: WishlistOutput;
  commonStyles: WishlistStyles["styles"];
  themedStyles: WishlistStyles["themedStyles"];
  onEdit?: () => void;
}

/**
 * Renders the header for the owner dashboard.
 * Uses Material Design 3 components.
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  wishlist,
  commonStyles,
  onEdit,
}) => {
  return (
    <View style={commonStyles.header}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text variant="headlineLarge" style={{ flex: 1 }}>
          {wishlist.title}
        </Text>
        {onEdit && (
          <Button
            mode="outlined"
            onPress={onEdit}
            accessibilityLabel="Edit wishlist"
          >
            Edit
          </Button>
        )}
      </View>
      {wishlist.description && (
        <Text variant="bodyMedium" style={{ marginTop: 8 }}>
          {wishlist.description}
        </Text>
      )}
      <Divider style={{ marginTop: 16 }} />
    </View>
  );
};
