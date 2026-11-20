import React, { useEffect, useRef, useState } from "react";
import {
  Platform,
  RefreshControl,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { ActivityIndicator, Icon, Surface, useTheme } from "react-native-paper";
import { MotiView } from "moti";
import { type AppTheme } from "../../theme/theme";
import {
  getPullDistance,
  getPullProgress,
  shouldTriggerRefresh,
} from "../../utils/pull-to-refresh";

/** Diameter of the circular indicator. */
const INDICATOR_SIZE = 40;
/** Where the indicator rests (px from the top) while a refresh is running. */
const REFRESHING_OFFSET = 56;

/**
 * Anything that exposes its scrollable host node, e.g. a `FlatList` or `ScrollView`
 * (on web, `getScrollableNode()` returns the scrolling DOM element).
 */
export interface ScrollableRef {
  getScrollableNode: () => unknown;
}

interface PullToRefreshProps {
  /** Whether a refresh is currently in progress. */
  refreshing: boolean;
  /** Called when the user releases the gesture past the threshold. */
  onRefresh: () => void;
  /** Ref to the wrapped list, used to only start the gesture when scrolled to the top. */
  scrollRef: React.RefObject<ScrollableRef | null>;
  /** The scrollable list. It must also receive `useNativeRefreshControl()` for native. */
  children: React.ReactNode;
  /** Optional style for the wrapping container. */
  style?: StyleProp<ViewStyle>;
}

/**
 * Pull-to-refresh for web.
 *
 * React Native Web ignores `RefreshControl`, and since the list scrolls inside its own
 * element (not the document) the browser's native pull-to-refresh never fires either.
 * This wrapper listens to touch gestures on mobile browsers and shows an MD3-style
 * indicator. On native it only renders its children: pass the result of
 * {@link useNativeRefreshControl} as the list's `refreshControl` there.
 *
 * Gesture state lives here (not in the screen), so pulling only re-renders the indicator.
 *
 * @param {PullToRefreshProps} props - The component props.
 * @returns {JSX.Element} The wrapped list with the pull indicator.
 */
export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  refreshing,
  onRefresh,
  scrollRef,
  children,
  style,
}) => {
  const theme = useTheme<AppTheme>();
  const containerRef = useRef<View>(null);
  const [distance, setDistance] = useState(0);
  const [dragging, setDragging] = useState(false);

  // Read the latest values from inside the (stable) DOM listeners.
  const refreshingRef = useRef(refreshing);
  const onRefreshRef = useRef(onRefresh);
  refreshingRef.current = refreshing;
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const container: unknown = containerRef.current;
    if (!(container instanceof HTMLElement)) return;

    let startY: number | null = null;
    let current = 0;

    const getScrollTop = () => {
      const node = scrollRef.current?.getScrollableNode();
      return node instanceof HTMLElement ? node.scrollTop : 0;
    };

    const reset = () => {
      startY = null;
      current = 0;
      setDragging(false);
      setDistance(0);
    };

    const onTouchStart = (e: TouchEvent) => {
      startY =
        refreshingRef.current || e.touches.length !== 1 || getScrollTop() > 0
          ? null
          : e.touches[0].clientY;
      current = 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY === null) return;
      const deltaY = e.touches[0].clientY - startY;

      // A normal upward scroll: let the list handle it.
      if (current === 0 && deltaY <= 0) {
        startY = null;
        return;
      }
      if (getScrollTop() > 0) {
        reset();
        return;
      }

      // We own the gesture: stop the browser from bouncing/scrolling the list.
      if (e.cancelable) e.preventDefault();
      current = getPullDistance(deltaY);
      setDragging(true);
      setDistance(current);
    };

    const onTouchEnd = () => {
      if (startY === null) return;
      const shouldRefresh = shouldTriggerRefresh(current);
      reset();
      if (shouldRefresh) onRefreshRef.current();
    };

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd);
    container.addEventListener("touchcancel", reset);
    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("touchcancel", reset);
    };
  }, [scrollRef]);

  if (Platform.OS !== "web") {
    return <View style={[styles.container, style]}>{children}</View>;
  }

  const progress = getPullProgress(distance);
  const visible = dragging || refreshing;
  const offset = dragging ? distance : refreshing ? REFRESHING_OFFSET : 0;

  return (
    <View ref={containerRef} style={[styles.container, style]}>
      {children}
      <MotiView
        pointerEvents="none"
        style={styles.indicatorWrapper}
        animate={{
          translateY: offset,
          opacity: visible ? (refreshing ? 1 : progress) : 0,
        }}
        transition={{ type: "timing", duration: dragging ? 0 : 200 }}
      >
        <Surface
          elevation={3}
          style={[
            styles.indicator,
            { backgroundColor: theme.colors.surfaceContainerHigh },
          ]}
        >
          {refreshing ? (
            <ActivityIndicator size={20} color={theme.colors.primary} />
          ) : (
            <View
              style={{
                transform: [{ rotate: `${String(progress * 270)}deg` }],
              }}
            >
              <Icon source="refresh" size={22} color={theme.colors.primary} />
            </View>
          )}
        </Surface>
      </MotiView>
    </View>
  );
};

/**
 * Themed `RefreshControl` for native lists; `undefined` on web, where
 * {@link PullToRefresh} handles the gesture instead.
 *
 * @param refreshing - Whether a refresh is currently in progress.
 * @param onRefresh - Called when the user pulls to refresh.
 * @returns The element to pass as the list's `refreshControl` prop.
 */
export function useNativeRefreshControl(
  refreshing: boolean,
  onRefresh: () => void,
): React.ReactElement<React.ComponentProps<typeof RefreshControl>> | undefined {
  const theme = useTheme<AppTheme>();
  if (Platform.OS === "web") return undefined;
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={[theme.colors.primary]}
      tintColor={theme.colors.primary}
      progressBackgroundColor={theme.colors.surfaceContainerHigh}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  indicatorWrapper: {
    position: "absolute",
    top: -INDICATOR_SIZE,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  indicator: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
