import { useTheme } from "@/contexts/ThemeContext";
import { innerApi } from "@/plugins/innerApi";
import { pluginRegistry } from "@/plugins/registry";
import {
  BottomBarConfig,
  CORE_PLUGIN_IDS,
  PluginInstance,
} from "@/plugins/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LayoutPanelTop } from "lucide-react-native";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const COLLAPSED_HEIGHT = 90;
const EXPANDED_HEIGHT = 150;
const FULL_HEIGHT = SCREEN_HEIGHT * 0.8;

const BOTTOM_BAR_STORAGE_KEY = "@lunel_bottom_bar_v2";
const WORKSPACE_STORAGE_KEY = "@lunel_workspace";

type SnapPoint = "collapsed" | "expanded" | "full";

const SNAP_HEIGHTS: Record<SnapPoint, number> = {
  collapsed: COLLAPSED_HEIGHT,
  expanded: EXPANDED_HEIGHT,
  full: FULL_HEIGHT,
};

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 150,
  mass: 1,
};

interface PluginBottomBarProps {
  isKeyboardVisible: boolean;
  openTab: (pluginId: string) => string;
  setActiveTab: (instanceId: string) => void;
}

interface BottomBarState {
  openTabs: PluginInstance[];
  activeTabId: string;
  bottomBarConfig: BottomBarConfig;
}

const DEFAULT_CONFIG: BottomBarConfig = {
  row1Slot5: "git",
  row2: ["explorer", "processes", "http", "ports", "tools", "monitor"],
};

// Memoized plugin button component
const PluginButton = memo(function PluginButton({
  pluginId,
  isActive,
  onPress,
  maxSize = 30,
  colors,
  spacing,
  radius,
}: {
  pluginId: string;
  isActive: boolean;
  onPress: () => void;
  maxSize?: number;
  colors: any;
  spacing: any;
  radius: any;
}) {
  const plugin = pluginRegistry.get(pluginId);
  if (!plugin) return null;

  const Icon = plugin.icon;
  const maxContainerSize = maxSize + 16;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.pluginButton, { maxWidth: maxContainerSize + spacing[2] * 2, padding: spacing[2] }]}
    >
      <View
        style={[
          styles.pluginIconContainer,
          {
            maxWidth: maxContainerSize,
            backgroundColor: isActive ? colors.accent.subtle : "transparent",
            borderColor: isActive ? colors.accent.subtle : "transparent",
            borderRadius: radius.sm,
          },
        ]}
      >
        <Icon
          size={Math.floor(maxContainerSize * 0.6)}
          color={isActive ? colors.accent.default : colors.fg.muted}
          strokeWidth={1.5}
        />
      </View>
    </TouchableOpacity>
  );
});

export default function PluginBottomBar({
  isKeyboardVisible,
  openTab,
  setActiveTab,
}: PluginBottomBarProps) {
  const { colors, radius, fonts, spacing } = useTheme();

  // Render trigger
  const [renderKey, setRenderKey] = useState(0);

  // Store state in refs to avoid reactive updates
  const stateRef = useRef<BottomBarState>({
    openTabs: [],
    activeTabId: "",
    bottomBarConfig: DEFAULT_CONFIG,
  });

  const [snapPoint, setSnapPoint] = useState<SnapPoint>("collapsed");

  // Reanimated shared values - runs on UI thread
  const height = useSharedValue(COLLAPSED_HEIGHT);
  const context = useSharedValue({ startHeight: COLLAPSED_HEIGHT });

  // Load state from storage
  const loadState = useCallback(async () => {
    try {
      const [workspaceStr, bottomBarStr] = await Promise.all([
        AsyncStorage.getItem(WORKSPACE_STORAGE_KEY),
        AsyncStorage.getItem(BOTTOM_BAR_STORAGE_KEY),
      ]);

      if (workspaceStr) {
        const workspace = JSON.parse(workspaceStr);
        stateRef.current.openTabs = workspace.openTabs || [];
        stateRef.current.activeTabId = workspace.activeTabId || "";
      }

      if (bottomBarStr) {
        stateRef.current.bottomBarConfig = {
          ...DEFAULT_CONFIG,
          ...JSON.parse(bottomBarStr),
        };
      }
    } catch (e) {
      console.warn("Failed to load bottom bar state:", e);
    }
  }, []);

  // Refresh function
  const refresh = useCallback(async () => {
    await loadState();
    setRenderKey((k) => k + 1);
  }, [loadState]);

  // Register with inner API on mount
  useEffect(() => {
    innerApi.registerBottomBar(refresh);
    loadState().then(() => setRenderKey((k) => k + 1));

    return () => {
      innerApi.unregisterBottomBar();
    };
  }, [refresh, loadState]);

  // Animate to snap point
  const animateTo = useCallback((point: SnapPoint) => {
    'worklet';
    const targetHeight = SNAP_HEIGHTS[point];
    height.value = withSpring(targetHeight, SPRING_CONFIG);
    runOnJS(setSnapPoint)(point);
  }, [height]);

  // Find nearest snap point
  const findNearestSnapPoint = useCallback((h: number): SnapPoint => {
    'worklet';
    let nearest: SnapPoint = "collapsed";
    let minDist = Math.abs(h - COLLAPSED_HEIGHT);

    if (Math.abs(h - EXPANDED_HEIGHT) < minDist) {
      nearest = "expanded";
      minDist = Math.abs(h - EXPANDED_HEIGHT);
    }
    if (Math.abs(h - FULL_HEIGHT) < minDist) {
      nearest = "full";
    }
    return nearest;
  }, []);

  // Gesture handler - runs on UI thread
  const panGesture = useMemo(() =>
    Gesture.Pan()
      .onStart(() => {
        context.value = { startHeight: height.value };
      })
      .onUpdate((event) => {
        const newHeight = context.value.startHeight - event.translationY;
        height.value = Math.max(COLLAPSED_HEIGHT, Math.min(FULL_HEIGHT, newHeight));
      })
      .onEnd((event) => {
        const velocityThreshold = 500;
        const currentHeight = height.value;

        let target: SnapPoint;

        if (event.velocityY > velocityThreshold) {
          // Fast swipe down
          target = "collapsed";
        } else if (event.velocityY < -velocityThreshold) {
          // Fast swipe up
          target = currentHeight > SCREEN_HEIGHT * 0.3 ? "full" : "expanded";
        } else {
          // Slow drag - snap to nearest
          target = findNearestSnapPoint(currentHeight);
        }

        animateTo(target);
      }),
    [height, context, animateTo, findNearestSnapPoint]
  );

  // Animated styles - runs on UI thread at 60fps
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      height: height.value,
      backgroundColor: interpolateColor(
        height.value,
        [COLLAPSED_HEIGHT, EXPANDED_HEIGHT],
        [colors.bg.base, colors.bg.raised]
      ),
    };
  }, [colors.bg.base, colors.bg.raised]);

  const animatedGrabberStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        height.value,
        [COLLAPSED_HEIGHT, EXPANDED_HEIGHT],
        [colors.bg.overlay, colors.bg.base]
      ),
    };
  }, [colors.bg.overlay, colors.bg.base]);

  const toggleTabsView = useCallback(() => {
    if (snapPoint === "full") {
      animateTo("collapsed");
    } else {
      animateTo("full");
    }
  }, [snapPoint, animateTo]);

  // Handle plugin press
  const handleOpenTab = useCallback((pluginId: string) => {
    const { openTabs } = stateRef.current;
    const existingTab = openTabs.find((t) => t.pluginId === pluginId);

    if (existingTab) {
      setActiveTab(existingTab.id);
    } else {
      openTab(pluginId);
    }

    if (snapPoint === "expanded") {
      animateTo("collapsed");
    }
  }, [openTab, setActiveTab, snapPoint, animateTo]);

  if (isKeyboardVisible) {
    return null;
  }

  // Read from refs (no reactive subscription)
  const { openTabs, activeTabId, bottomBarConfig } = stateRef.current;
  const row1ExtraId = bottomBarConfig.row1Slot5;
  const row2PluginIds = bottomBarConfig.row2.filter((id): id is string => id !== null);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.container,
          {
            borderTopColor: colors.bg.overlay,
            borderLeftColor: colors.bg.overlay,
            borderRightColor: colors.bg.overlay,
          },
          animatedContainerStyle,
        ]}
      >
        <View style={styles.innerContainer}>
          {/* Grabber */}
          <View style={styles.grabberContainer}>
            <Animated.View
              style={[
                styles.grabber,
                { borderRadius: radius.sm },
                animatedGrabberStyle,
              ]}
            />
          </View>

          {/* Row 1: Core plugins + 1 extra slot + tabs button */}
          <View style={[styles.row, { paddingHorizontal: spacing[3], paddingBottom: spacing[2] }]}>
            <View style={styles.rowInner}>
              {CORE_PLUGIN_IDS.map((id) => (
                <PluginButton
                  key={id}
                  pluginId={id}
                  isActive={openTabs.some((t) => t.pluginId === id && t.id === activeTabId)}
                  onPress={() => handleOpenTab(id)}
                  colors={colors}
                  spacing={spacing}
                  radius={radius}
                />
              ))}
              {row1ExtraId && (
                <PluginButton
                  key={row1ExtraId}
                  pluginId={row1ExtraId}
                  isActive={openTabs.some((t) => t.pluginId === row1ExtraId && t.id === activeTabId)}
                  onPress={() => handleOpenTab(row1ExtraId)}
                  colors={colors}
                  spacing={spacing}
                  radius={radius}
                />
              )}
              <TouchableOpacity
                onPress={toggleTabsView}
                style={[styles.pluginButton, { maxWidth: 46 + spacing[2] * 2, padding: spacing[2] }]}
              >
                <View
                  style={[
                    styles.pluginIconContainer,
                    {
                      maxWidth: 46,
                      backgroundColor: snapPoint === "full" ? colors.accent.subtle : "transparent",
                      borderColor: snapPoint === "full" ? colors.accent.subtle : "transparent",
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <LayoutPanelTop
                    width="60%"
                    height="60%"
                    color={snapPoint === "full" ? colors.accent.default : colors.fg.muted}
                    strokeWidth={1.5}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Row 2: Extra plugins */}
          <View style={[styles.row, { paddingHorizontal: spacing[3], paddingBottom: spacing[2] }]}>
            <View style={styles.rowInner}>
              {row2PluginIds.map((id) => (
                <PluginButton
                  key={id}
                  pluginId={id}
                  isActive={openTabs.some((t) => t.pluginId === id && t.id === activeTabId)}
                  onPress={() => handleOpenTab(id)}
                  colors={colors}
                  spacing={spacing}
                  radius={radius}
                />
              ))}
            </View>
          </View>

          {/* Full view content */}
          <View style={[styles.fullViewContent, { marginTop: spacing[4], paddingHorizontal: spacing[3] }]}>
            <Text style={[styles.fullViewText, { fontFamily: fonts.sans.medium, color: colors.fg.muted }]}>
              Tap a plugin icon to switch
            </Text>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: -1,
    left: -1,
    right: -1,
    overflow: "hidden",
    borderTopWidth: 0.7,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  innerContainer: {
    height: FULL_HEIGHT,
  },
  grabberContainer: {
    width: "100%",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 4,
  },
  grabber: {
    width: 40,
    height: 5,
  },
  row: {},
  rowInner: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  pluginButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pluginIconContainer: {
    width: "100%",
    aspectRatio: 1,
    overflow: "hidden",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fullViewContent: {
    flex: 1,
  },
  fullViewText: {
    fontSize: 14,
    textAlign: "center",
  },
});
