import { Stack } from "expo-router";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { View, StyleSheet, useColorScheme } from "react-native";
import { Colors } from "../src/constants/Colors";
import { AppErrorBoundary } from "../src/components/AppErrorBoundary";
import { ConfigErrorScreen } from "../src/components/ConfigErrorScreen";
import { GeneralErrorScreen } from "../src/components/GeneralErrorScreen";

import { CoreProvider } from "../src/providers/CoreProvider";

/**
 * Root orchestrator component that manages dependencies and routing.
 * Wrapped in a general AppErrorBoundary to catch any unexpected runtime errors.
 *
 * @returns {JSX.Element} The app root layout wrapped in AppErrorBoundary and any providers.
 */
export default function Root() {
  const [initError, setInitError] = useState<Error | null>(null);

  if (initError) {
    return (
      <ConfigErrorScreen
        onRetry={() => {
          setInitError(null);
        }}
      />
    );
  }

  return (
    <AppErrorBoundary fallback={<GeneralErrorScreen />}>
      <CoreProvider onConfigError={setInitError}>
        <RootLayout />
      </CoreProvider>
    </AppErrorBoundary>
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
