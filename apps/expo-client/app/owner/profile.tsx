import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  useTheme,
  Surface,
  ActivityIndicator,
  IconButton,
  Portal,
  Snackbar,
} from "react-native-paper";
import { Stack } from "expo-router";
import { useUser } from "../../src/contexts/UserContext";
import { useProfile } from "../../src/features/profile/hooks/useProfile";
import { Avatar } from "../../src/components/common/Avatar";
import { Layout } from "../../src/constants/Layout";

/**
 * Profile Screen allows users to view and edit their public metadata.
 * Implements "in-place" editing to minimize layout shifts.
 */
export default function ProfileScreen() {
  const { userId, loading: userLoading, isSessionReliable } = useUser();
  const {
    profile,
    loading: profileLoading,
    error,
    refetch,
  } = useProfile(userId ?? undefined);
  const theme = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  // Initialize form state when profile data is loaded
  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setBio(profile.bio ?? "");
    }
  }, [profile]);

  const handleEditToggle = useCallback(() => {
    if (isEditing) {
      // TODO: Implement UpdateProfileUseCase to persist changes
      setSnackbarVisible(true);
    }
    setIsEditing(!isEditing);
  }, [isEditing]);

  const onDismissSnackBar = () => {
    setSnackbarVisible(false);
  };

  if (userLoading || (profileLoading && !profile)) {
    return (
      <Surface style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </Surface>
    );
  }

  if (!isSessionReliable || error || !profile) {
    return (
      <Surface style={styles.centerContainer}>
        <Text
          variant="headlineSmall"
          style={{ color: theme.colors.error, marginBottom: 16 }}
        >
          {error ?? "Profile not available"}
        </Text>
        <Button mode="contained" onPress={() => void refetch()}>
          Retry
        </Button>
      </Surface>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <Surface
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Stack.Screen
          options={{
            title: "My Profile",
            headerRight: undefined, // Removed from header
          }}
        />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Surface mode="outlined" style={styles.card}>
            <View style={styles.cardHeader}>
              <IconButton
                icon={isEditing ? "check" : "pencil"}
                mode={isEditing ? "contained" : "ghost"}
                containerColor={isEditing ? theme.colors.primary : undefined}
                iconColor={
                  isEditing ? theme.colors.onPrimary : theme.colors.primary
                }
                size={24}
                onPress={handleEditToggle}
                style={styles.editButton}
              />
            </View>

            <View style={styles.avatarSection}>
              <Avatar uri={profile.imageUrl} size={140} style={styles.avatar} />
              {isEditing && (
                <IconButton
                  icon="camera"
                  mode="contained-tonal"
                  size={24}
                  style={styles.avatarEditButton}
                  onPress={() => {
                    /* TODO: Implement Image Picker */
                  }}
                />
              )}
            </View>

            <View style={styles.form}>
              {/* Field: Username */}
              <View style={styles.fieldWrapper}>
                {isEditing ? (
                  <TextInput
                    label="Username"
                    value={username}
                    onChangeText={setUsername}
                    mode="outlined"
                    outlineStyle={styles.inputOutline}
                    style={styles.input}
                    error={username.length < 3}
                    placeholder="Enter your username"
                  />
                ) : (
                  <View style={styles.viewField}>
                    <Text
                      variant="labelMedium"
                      style={{ color: theme.colors.primary }}
                    >
                      Username
                    </Text>
                    <Text variant="headlineSmall" style={styles.viewText}>
                      {profile.username}
                    </Text>
                  </View>
                )}
              </View>

              {/* Field: Bio */}
              <View style={styles.fieldWrapper}>
                {isEditing ? (
                  <TextInput
                    label="Biography"
                    value={bio}
                    onChangeText={setBio}
                    mode="outlined"
                    multiline
                    numberOfLines={4}
                    outlineStyle={styles.inputOutline}
                    style={[styles.input, styles.bioInput]}
                    placeholder="Tell others about yourself..."
                  />
                ) : (
                  <View style={styles.viewField}>
                    <Text
                      variant="labelMedium"
                      style={{ color: theme.colors.primary }}
                    >
                      Biography
                    </Text>
                    <Text
                      variant="bodyLarge"
                      style={[styles.viewText, styles.bioText]}
                    >
                      {profile.bio ?? "No biography yet."}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Surface>
        </ScrollView>

        <Portal>
          <Snackbar
            visible={snackbarVisible}
            onDismiss={onDismissSnackBar}
            duration={Snackbar.DURATION_SHORT}
            action={{
              label: "OK",
              onPress: onDismissSnackBar,
            }}
          >
            Profile changes saved (Demo)
          </Snackbar>
        </Portal>
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  scrollContent: {
    padding: 16,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
    paddingTop: Platform.OS === "web" ? Layout.headerHeightWeb + 40 : 40,
  },
  card: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: "transparent", // Use elevation surface color naturally
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: -24, // Pull avatar closer
    zIndex: 1,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 40,
    position: "relative",
  },
  avatar: {
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarEditButton: {
    position: "absolute",
    bottom: -10,
    right: Platform.OS === "web" ? "calc(50% - 75px)" : "35%",
  },
  form: {
    width: "100%",
  },
  fieldWrapper: {
    minHeight: 90,
    marginBottom: 24,
    justifyContent: "center",
  },
  viewField: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  viewText: {
    marginTop: 4,
    fontWeight: "500",
  },
  bioText: {
    lineHeight: 24,
    fontWeight: "400",
  },
  input: {
    backgroundColor: "transparent",
  },
  bioInput: {
    minHeight: 120,
  },
  inputOutline: {
    borderRadius: 16,
  },
  editButton: {
    margin: 0,
  },
});
