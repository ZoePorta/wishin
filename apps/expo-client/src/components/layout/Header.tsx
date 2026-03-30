import React from "react";
import { IconButton, useTheme } from "react-native-paper";
import { type AppTheme } from "../../theme/theme";
import { MotiView, AnimatePresence } from "moti";
import { AuthButtons } from "../common/AuthButtons";
import { router } from "expo-router";
import { type NativeStackHeaderProps } from "@react-navigation/native-stack";
import {
  StyleSheet,
  View,
  Image,
  Platform,
  Pressable,
  useWindowDimensions,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Layout } from "../../constants/Layout";
import Logo from "../../../assets/wishinlogo.svg";

interface HeaderProps extends Partial<NativeStackHeaderProps> {
  onLogin?: () => void;
  onGetStarted?: () => void;
}

/**
 * Shared Header component - Replicates the design from landing.html
 * Adapts to navigation state: shows back button if history exists, otherwise logo.
 *
 * @param {HeaderProps} props - The component props
 * @returns {JSX.Element} The rendered header
 */
export const Header = ({
  onLogin,
  onGetStarted,
  navigation,
  back,
}: HeaderProps) => {
  const theme = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(
    () => makeStyles(theme, insets),
    [theme, insets],
  );
  const isBackAvailable = !!back && !!navigation;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768; // Tablet and Desktop
  const isMobileS = width <= 360;

  const handleLogoPress = () => {
    if (isBackAvailable) {
      navigation.goBack();
    } else {
      router.push("/");
    }
  };

  return (
    <View
      style={[
        styles.nav,
        {
          borderBottomColor: "transparent",
          // Fixed background for web backdrop-filter, or BlurView for native
          backgroundColor:
            Platform.OS === "web" ? theme.colors.surfaceGlass : "transparent",
        },
        Platform.OS === "web" && {
          // @ts-expect-error - backdropFilter is supported on most modern browsers
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        },
        isMobileS && styles.navMobileS,
      ]}
    >
      {Platform.OS !== "web" && (
        <BlurView
          intensity={80}
          tint={theme.dark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={styles.navContent}>
        <View style={styles.logoContainer}>
          <AnimatePresence exitBeforeEnter>
            {isBackAvailable ? (
              <MotiView
                key="back-button"
                from={{ opacity: 0, scale: 0.5, rotate: "-90deg" }}
                animate={{ opacity: 1, scale: 1, rotate: "0deg" }}
                exit={{ opacity: 0, scale: 0.5, rotate: "90deg" }}
                transition={{ type: "spring", damping: 15 }}
              >
                <IconButton
                  icon="arrow-left"
                  size={28}
                  onPress={handleLogoPress}
                  accessibilityLabel="Go back"
                />
              </MotiView>
            ) : (
              <MotiView
                key="logo"
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", damping: 15 }}
              >
                <Pressable
                  onPress={handleLogoPress}
                  accessibilityLabel="Go to home"
                  style={({ pressed }) => [
                    styles.logoPressable,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <View style={styles.brandingWrapper}>
                    <Image
                      source={Logo}
                      style={styles.logo}
                      resizeMode="contain"
                    />
                    {isDesktop && (
                      <Text
                        style={[
                          styles.brandText,
                          {
                            color: theme.colors.primary,
                            ...theme.fonts.headlineSmall,
                          },
                        ]}
                      >
                        Wishin
                      </Text>
                    )}
                  </View>
                </Pressable>
              </MotiView>
            )}
          </AnimatePresence>
        </View>

        <View style={styles.navActions}>
          <AuthButtons onLogin={onLogin} onRegister={onGetStarted} />
        </View>
      </View>
    </View>
  );
};

const makeStyles = (theme: AppTheme, insets: { top: number }) =>
  StyleSheet.create({
    nav: {
      paddingHorizontal: 24,
      paddingTop: Platform.OS === "web" ? 0 : insets.top,
      height:
        Platform.OS === "web"
          ? Layout.headerHeightWeb
          : Layout.headerHeightWeb + insets.top,
      justifyContent: "center",
      zIndex: 100,
      borderBottomWidth: 1,
      position: (Platform.OS === "web" ? "fixed" : "relative") as "relative",
      top: 0,
      left: 0,
      right: 0,
      // Elevation/Shadow
      elevation: 3,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
    },
    navMobileS: {
      paddingHorizontal: 12,
    },
    navContent: {
      maxWidth: 1280,
      width: "100%",
      marginHorizontal: "auto",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    logoContainer: {
      height: 48,
      minWidth: 48,
      justifyContent: "center",
      alignItems: "flex-start",
    },
    logoPressable: {
      paddingVertical: 4,
    },
    logo: { height: 32, width: 32 },
    brandingWrapper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    brandText: {
      marginLeft: 4,
    },
    navLinks: { flexDirection: "row", gap: 32 },
    navLink: { fontWeight: "700", fontSize: 16 },
    navActions: { flexDirection: "row", alignItems: "center" },
  });
