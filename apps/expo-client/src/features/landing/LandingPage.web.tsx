import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { themeTokens } from "../../theme/themeConfig";
import { AuthModal } from "../../components/auth/AuthModal";
import { TryAppDialog } from "./TryAppDialog";

/**
 * Hybrid LandingPage - Shared Header (React) + Body (iframe)
 */
export const LandingPage = () => {
  const [authVisible, setAuthVisible] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [tryAppVisible, setTryAppVisible] = useState(false);

  // Convert tokens to a compact string for the iframe
  const themeParams = new URLSearchParams({
    tokens: JSON.stringify(themeTokens),
  }).toString();

  const handleOpenAuth = useCallback((mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthVisible(true);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin to prevent XSS/CSRF
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data === "open-register") {
        handleOpenAuth("register");
      } else if (event.data === "open-login") {
        handleOpenAuth("login");
      } else if (event.data === "open-try-app") {
        setTryAppVisible(true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [handleOpenAuth]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <iframe
          src={`/landing-content.html?${themeParams}`}
          style={{ width: "100%", height: "100%", border: "none" }}
          title="Wishin landing content — Features and Getting Started"
          aria-label="Wishin landing content"
        />
      </View>
      <AuthModal
        visible={authVisible}
        onDismiss={() => {
          setAuthVisible(false);
        }}
        initialMode={authMode}
      />
      <TryAppDialog
        visible={tryAppVisible}
        onDismiss={() => {
          setTryAppVisible(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: "100%",
    flexDirection: "column",
  },
  content: {
    flex: 1,
  },
});
