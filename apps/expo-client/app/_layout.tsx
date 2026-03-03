import { Stack } from "expo-router";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, useColorScheme } from "react-native";
import { PaperProvider, Surface } from "react-native-paper";
import { combinedTheme } from "../src/theme";
import { AppErrorBoundary } from "../src/components/core/AppErrorBoundary";
import { ConfigErrorScreen } from "../src/components/core/ConfigErrorScreen";
import { GeneralErrorScreen } from "../src/components/core/GeneralErrorScreen";

import { CoreProvider } from "../src/providers/CoreProvider";

/**
 * Root orchestrator component that manages dependencies and routing.
 * Wrapped in a general AppErrorBoundary to catch any unexpected runtime errors.
 *
 * @returns {JSX.Element} The root app layout containing global providers and routing.
 */
export default function Root() {
  const [initError, setInitError] = useState<Error | null>(null);
  const colorScheme = useColorScheme();
  const theme =
    colorScheme === "dark" ? combinedTheme.dark : combinedTheme.light;

  return (
    <PaperProvider theme={theme}>
      {initError ? (
        <ConfigErrorScreen
          onRetry={() => {
            setInitError(null);
          }}
        />
      ) : (
        <AppErrorBoundary fallback={<GeneralErrorScreen />}>
          <CoreProvider onConfigError={setInitError}>
            <RootLayout />
          </CoreProvider>
        </AppErrorBoundary>
      )}
    </PaperProvider>
  );
}

/**
 * UI shell for the application including navigation and theme management.
 */
function RootLayout() {
  const colorScheme = useColorScheme();
  const theme =
    colorScheme === "dark" ? combinedTheme.dark : combinedTheme.light;

  return (
    <Surface style={styles.container}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.onSurface,
          headerShadowVisible: false,
          headerTitleStyle: {
            fontWeight: "bold",
          },
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Welcome to Wishin" }} />
        <Stack.Screen name="wishlist/[id]" options={{ title: "Wishlist" }} />
      </Stack>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
