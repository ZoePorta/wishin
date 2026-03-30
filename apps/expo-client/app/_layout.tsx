import { Stack } from "expo-router";
import { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, useColorScheme, Platform } from "react-native";
import { PaperProvider, Surface, useTheme } from "react-native-paper";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { combinedTheme, fallbackTheme } from "../src/theme";
import type { AppTheme } from "../src/theme";
import { AppErrorBoundary } from "../src/components/core/AppErrorBoundary";
import { ConfigErrorScreen } from "../src/components/core/ConfigErrorScreen";
import { GeneralErrorScreen } from "../src/components/core/GeneralErrorScreen";
import { CoreProvider } from "../src/providers/CoreProvider";
import { Header } from "../src/components/layout/Header";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { Aclonica_400Regular } from "@expo-google-fonts/aclonica";
import { VarelaRound_400Regular } from "@expo-google-fonts/varela-round";
import { Layout } from "../src/constants/Layout";

SplashScreen.preventAutoHideAsync().catch((e: unknown) => {
  console.error("Failed to prevent splash screen auto hide", e);
});

/**
 * Root orchestrator component that manages dependencies and routing.
 */
export default function Root() {
  const [initError, setInitError] = useState<Error | null>(null);
  const colorScheme = useColorScheme();

  const [fontsLoaded, fontError] = useFonts({
    Aclonica_400Regular,
    VarelaRound_400Regular,
  });

  const baseTheme = fontError ? fallbackTheme : combinedTheme;
  const theme = colorScheme === "dark" ? baseTheme.dark : baseTheme.light;

  useEffect(() => {
    if (fontError) {
      console.error("Custom fonts failed to load", fontError);
    }

    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch((e: unknown) => {
        console.error("Failed to hide splash screen", e);
      });
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError && Platform.OS !== "web") {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
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
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * UI shell for the application including navigation and theme management.
 */
function RootLayout() {
  const theme = useTheme<AppTheme>();
  const colorScheme = useColorScheme();

  return (
    <Surface style={styles.container}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          header: (props) => <Header {...props} />,
          contentStyle: {
            backgroundColor: theme.colors.background,
            paddingTop: Platform.OS === "web" ? Layout.headerHeightWeb : 0,
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: true,
          }}
        />
        <Stack.Screen name="wishlist/[id]" options={{}} />
      </Stack>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
