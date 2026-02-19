import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import { Colors } from "../src/constants/Colors";
import { WishlistRepositoryProvider } from "../src/contexts/WishlistRepositoryContext";
import { MockWishlistRepository } from "@wishin/infrastructure";

/**
 * Root orchestrator component that manages dependencies.
 * This keeps the UI layout clean and focused on navigation.
 */
export default function Root() {
  const repository = useMemo(() => new MockWishlistRepository(), []);

  return (
    <WishlistRepositoryProvider repository={repository}>
      <RootLayout />
    </WishlistRepositoryProvider>
  );
}

/**
 * UI shell for the application including navigation and theme management.
 */
function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerTintColor: theme.text,
          headerShadowVisible: false,
          headerTitleStyle: {
            fontWeight: "bold",
          },
          contentStyle: {
            backgroundColor: theme.background,
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Welcome to Wishin" }} />
        <Stack.Screen name="wishlist/[id]" options={{ title: "Wishlist" }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
