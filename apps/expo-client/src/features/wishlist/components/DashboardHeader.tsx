import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Divider } from "react-native-paper";
import { type WishlistOutput, type ProfileOutput } from "@wishin/domain";
import { Avatar } from "../../../components/common/Avatar";

interface DashboardHeaderProps {
  wishlist: WishlistOutput;
  profile?: ProfileOutput | null;
}

/**
 * Renders the header for the owner dashboard.
 * Uses Material Design 3 components.
 *
 * @param {DashboardHeaderProps} props - The component props.
 * @param {WishlistOutput} props.wishlist - The wishlist object whose title and description are shown.
 * @param {ProfileOutput | null} [props.profile] - The current user's profile information.
 * @returns {JSX.Element} The rendered dashboard header.
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  wishlist,
  profile,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <Avatar uri={profile?.imageUrl} size={80} style={styles.avatar} />
        <Text variant="titleLarge" style={styles.username}>
          {profile?.username ?? "Owner"}
        </Text>
      </View>

      <View style={styles.contentBlock}>
        <Text variant="headlineLarge" style={styles.title}>
          {wishlist.title}
        </Text>
        {wishlist.description && (
          <Text variant="bodyLarge" style={styles.description}>
            {wishlist.description}
          </Text>
        )}
        <Divider style={styles.divider} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 16,
  },
  avatar: {
    marginBottom: 8,
  },
  username: {
    fontWeight: "600",
  },
  contentBlock: {
    width: "100%",
  },
  title: {
    fontWeight: "700",
  },
  description: {
    marginTop: 8,
    lineHeight: 24,
  },
  divider: {
    marginTop: 24,
  },
});
