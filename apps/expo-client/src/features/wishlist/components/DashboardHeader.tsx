import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { Text, Divider, useTheme, IconButton } from "react-native-paper";
import { type WishlistOutput, type ProfileOutput } from "@wishin/domain";
import { Avatar } from "../../../components/common/Avatar";
import { type AppTheme } from "../../../theme/theme";

interface DashboardHeaderProps {
  wishlist: WishlistOutput;
  profile?: ProfileOutput | null;
  onEditAvatar?: () => void;
  onEditUsername?: () => void;
  /**
   * Whether the profile is currently being updated.
   */
  isUpdating?: boolean;
}

const COMPONENT_SIZE = 300;
const CONTAINER_PADDING = 12;

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
  onEditAvatar,
  onEditUsername,
  isUpdating = false,
}) => {
  const theme = useTheme<AppTheme>();
  const [containerSize, setContainerSize] = React.useState(COMPONENT_SIZE);

  const responsiveAvatarSize = containerSize - CONTAINER_PADDING * 2;

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <View
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            setContainerSize(width);
          }}
          style={[
            styles.avatarContainer,
            {
              backgroundColor: theme.colors.surfaceContainerLowest,
              borderColor: theme.colors.outlineVariant,
              borderRadius: containerSize / 2,
            },
          ]}
        >
          <Avatar uri={profile?.imageUrl} size={responsiveAvatarSize} />
          {isUpdating && (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: theme.colors.surfaceGlass,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: containerSize / 2,
                },
              ]}
            >
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}
          {onEditAvatar && !isUpdating && (
            <IconButton
              icon="camera-outline"
              size={24}
              mode="contained"
              containerColor={theme.colors.surface}
              iconColor={theme.colors.primary}
              onPress={onEditAvatar}
              style={[styles.editButton, { shadowColor: theme.colors.shadow }]}
              accessibilityLabel="Edit profile picture"
            />
          )}
        </View>
        <View style={styles.usernameRow}>
          <Text variant="titleLarge" style={styles.username}>
            {profile?.username ?? "Owner"}
          </Text>
          {onEditUsername && (
            <IconButton
              icon="pencil-outline"
              size={18}
              onPress={onEditUsername}
              style={styles.usernameEditButton}
              accessibilityLabel="Edit username"
            />
          )}
        </View>
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
  avatarContainer: {
    width: COMPONENT_SIZE,
    maxWidth: "80%",
    aspectRatio: 1,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: CONTAINER_PADDING,
    marginBottom: 16,
  },
  username: {
    fontWeight: "600",
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateX: 21 }], // Half of IconButton width (approx 42px)
  },
  usernameEditButton: {
    margin: 0,
    marginLeft: 4,
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
  editButton: {
    position: "absolute",
    right: 8,
    bottom: 8,
    margin: 0,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
