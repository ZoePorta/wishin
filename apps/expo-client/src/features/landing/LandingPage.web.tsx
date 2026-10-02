import React, { useState, useEffect, useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { themeTokens } from "../../theme/themeConfig";
import { AuthModal } from "../../components/auth/AuthModal";
import { TryAppDialog } from "./TryAppDialog";
import { AddToHomeScreenDialog } from "./AddToHomeScreenDialog";
import { detectApplePlatform, isStandaloneDisplay } from "../../utils/platform";
import { useTranslation } from "react-i18next";

/**
 * Hybrid LandingPage - Shared Header (React) + Body (iframe)
 */
export const LandingPage = () => {
  const { t, i18n } = useTranslation();
  const [authVisible, setAuthVisible] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [tryAppVisible, setTryAppVisible] = useState(false);
  const [addToHomeVisible, setAddToHomeVisible] = useState(false);

  const applePlatform = useMemo(
    () => detectApplePlatform(window.navigator),
    [],
  );

  // Convert tokens (and language/platform hints) to a compact string for the iframe
  const iframeParams = useMemo(() => {
    const params = new URLSearchParams({
      tokens: JSON.stringify(themeTokens),
      lang: i18n.language,
    });
    if (applePlatform) {
      params.set("platform", applePlatform);
      const standalone = isStandaloneDisplay(
        window.navigator as Navigator & { standalone?: boolean },
        (query) => window.matchMedia(query).matches,
      );
      if (standalone) params.set("standalone", "1");
    }
    return params.toString();
  }, [applePlatform, i18n.language]);

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
      } else if (event.data === "open-add-to-home") {
        setAddToHomeVisible(true);
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
          src={`/landing-content.html?${iframeParams}`}
          style={{ width: "100%", height: "100%", border: "none" }}
          title={t("landing.iframeTitle")}
          aria-label={t("landing.iframeLabel")}
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
      {applePlatform && (
        <AddToHomeScreenDialog
          visible={addToHomeVisible}
          onDismiss={() => {
            setAddToHomeVisible(false);
          }}
          platform={applePlatform}
        />
      )}
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
