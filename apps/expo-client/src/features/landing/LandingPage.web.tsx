import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { Header } from "../../components/layout/Header";
import { themeTokens } from "../../theme/themeConfig";
import { AuthModal } from "../../components/auth/AuthModal";

/**
 * Hybrid LandingPage - Shared Header (React) + Body (iframe)
 */
export const LandingPage = () => {
  const [authVisible, setAuthVisible] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");

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
      if (event.data === "open-register") {
        handleOpenAuth("register");
      } else if (event.data === "open-login") {
        handleOpenAuth("login");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [handleOpenAuth]);

  return (
    <View style={styles.container}>
      <Header
        onLogin={() => {
          handleOpenAuth("login");
        }}
        onGetStarted={() => {
          handleOpenAuth("register");
        }}
      />
      <View style={styles.content}>
        <iframe
          src={`/landing-content.html?${themeParams}`}
          style={{ width: "100%", height: "100%", border: "none" }}
          title="Wishin Content"
        />
      </View>
      <AuthModal
        visible={authVisible}
        onDismiss={() => {
          setAuthVisible(false);
        }}
        initialMode={authMode}
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
});
