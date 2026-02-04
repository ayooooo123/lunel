import PluginHeader, { BaseTab } from "@/components/PluginHeader";
import { ERUDA_BASE64 } from "@/constants/eruda";
import { radius } from "@/constants/themes";
import { useTheme } from "@/contexts/ThemeContext";
import { X, ArrowLeft, ArrowRight, RotateCw, Search, Code, Globe, Plus } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  InputAccessoryView,
  InteractionManager,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { WebView } from "react-native-webview";
import { PluginPanelProps } from "../../types";

const springConfig = {
  damping: 20,
  stiffness: 200,
  mass: 0.8,
};

interface Tab extends BaseTab {
  url: string;
  loading?: boolean;
  canGoBack?: boolean;
  canGoForward?: boolean;
  favicon?: string;
  ready?: boolean;
}

const AnimatedBrowserTab = memo(
  ({
    tab,
    isActive,
    isLast,
    showDivider,
    targetWidth,
    colors,
    onPress,
    onClose,
    isNew,
    getFavicon,
  }: {
    tab: Tab;
    isActive: boolean;
    isLast: boolean;
    showDivider: boolean;
    targetWidth: number;
    colors: any;
    onPress: () => void;
    onClose: () => void;
    isNew: boolean;
    getFavicon: (url: string) => string;
  }) => {
    const width = useSharedValue(isNew ? 0 : targetWidth);
    const opacity = useSharedValue(isNew ? 0 : 1);
    const scale = useSharedValue(1);

    useEffect(() => {
      width.value = withSpring(targetWidth, springConfig);
      opacity.value = withSpring(1, springConfig);
    }, [targetWidth]);

    const animatedStyle = useAnimatedStyle(() => ({
      width: width.value,
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    };

    const handlePress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    };

    const handleClose = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onClose();
    };

    return (
      <Animated.View style={[animatedStyle, { overflow: "hidden" }]}>
        <TouchableOpacity
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          style={{
            height: 35,
            borderRadius: radius.sm,
            marginBottom: 12,
            marginRight: isLast ? 0 : 2,
            paddingLeft: 8,
            borderWidth: 0.7,
            paddingRight: 6,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: isActive ? colors.bg.base : "transparent",
            borderColor: isActive ? colors.bg.overlay : "transparent",
          }}
        >
          {showDivider && (
            <View
              style={{
                position: "absolute",
                right: -2,
                width: 1,
                height: 20,
                backgroundColor: colors.bg.overlay,
                top: 7,
              }}
            />
          )}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              flex: 1,
              marginRight: isActive ? 6 : 0,
            }}
          >
            <View
              style={{
                width: 16,
                height: 16,
                marginRight: 8,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {tab.loading ? (
                <ActivityIndicator
                  size="small"
                  color={colors.accent.default}
                  style={{ transform: [{ scale: 0.7 }] }}
                />
              ) : (
                <Image
                  source={{ uri: tab.favicon || getFavicon(tab.url) }}
                  style={{ width: 16, height: 16 }}
                  resizeMode="contain"
                />
              )}
            </View>

            <Text
              numberOfLines={1}
              style={{
                fontSize: 13,
                color: isActive ? colors.fg.default : colors.fg.muted,
                flex: 1,
              }}
            >
              {tab.title || "New Tab"}
            </Text>
          </View>

          {isActive && (
            <TouchableOpacity
              onPress={handleClose}
              style={{
                width: 20,
                height: 20,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radius.full,
                backgroundColor: colors.bg.raised,
                padding: 0,
              }}
            >
              <X size={14} color={colors.fg.default} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

export default function BrowserPanel({
  instanceId,
  isActive,
}: PluginPanelProps) {
  const { colors, radius } = useTheme();
  const colorScheme = useColorScheme();

  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: "1",
      url: "https://www.google.com",
      title: "New Tab",
      loading: false,
    },
  ]);

  const [activeTabId, setActiveTabId] = useState("1");
  const [urlInput, setUrlInput] = useState("https://www.google.com");
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const webViewRefs = useRef<{ [key: string]: WebView | null }>({});
  const urlInputRef = useRef<TextInput>(null);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  const getTabWidth = useCallback((count: number) => {
    return 120;
  }, []);

  // Script to set up Trusted Types policy before page loads
  const trustedTypesSetupScript = `
    (function() {
      if (window.trustedTypes && trustedTypes.createPolicy) {
        try {
          if (!trustedTypes.defaultPolicy) {
            trustedTypes.createPolicy('default', {
              createHTML: (string) => string,
              createScript: (string) => string,
              createScriptURL: (string) => string,
            });
          }
        } catch (e) {}
      }
    })();
    true;
  `;

  const erudaInjectionScript = `
    (function() {
      if (window.eruda) {
        eruda.show();
        return;
      }
      try {
        var script = atob("${ERUDA_BASE64}");
        eval(script);
        eruda.init({
          useShadowDom: true,
          autoScale: true,
          tool: ['console', 'elements', 'network', 'resources', 'sources', 'info', 'snippets'],
          defaults: {
            displaySize: 50,
            transparency: 1,
            theme: '${colorScheme === "dark" ? "Dark" : "Light"}'
          }
        });
        eruda.show();
        // Remove the floating entry button and force solid background
        var erudaEl = document.getElementById('eruda');
        if (erudaEl && erudaEl.shadowRoot) {
          var entryBtn = erudaEl.shadowRoot.querySelector('.eruda-entry-btn');
          if (entryBtn) entryBtn.remove();

          var style = document.createElement('style');
          style.innerHTML = \`
            .eruda-dev-tools { 
              background: ${colors.bg.base} !important; 
              opacity: 1 !important; 
            }
            .eruda-header { 
              background: ${colors.bg.raised} !important; 
            }
            .eruda-nav-bar {
              background: ${colors.bg.base} !important;
            }
          \`;
          erudaEl.shadowRoot.appendChild(style);
        }
      } catch(e) {
        console.warn('Eruda injection failed:', e);
      }
    })();
    true;
  `;

  const createNewTab = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newId = Date.now().toString();
    const newTab: Tab = {
      id: newId,
      url: "https://www.google.com",
      title: "New Tab",
      loading: false,
      ready: false,
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
    setUrlInput("https://www.google.com");
    setDevToolsOpen(false);

    InteractionManager.runAfterInteractions(() => {
      setTabs((prev) =>
        prev.map((t) => (t.id === newId ? { ...t, ready: true } : t))
      );
    });
  };

  const closeTab = (tabId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const newTabs = tabs.filter((tab) => tab.id !== tabId);
    setTabs(newTabs);

    if (activeTabId === tabId) {
      if (newTabs.length > 0) {
        const index = tabs.findIndex((t) => t.id === tabId);
        const newActiveTab = newTabs[Math.max(0, index - 1)];
        setActiveTabId(newActiveTab.id);
        setUrlInput(newActiveTab.url);
      } else {
        setActiveTabId("");
        setUrlInput("");
      }
    }

    delete webViewRefs.current[tabId];
  };

  const handleUrlSubmit = () => {
    let url = urlInput.trim();
    if (!url) return;

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      if (url.includes(".") && !url.includes(" ")) {
        url = "https://" + url;
      } else {
        url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
      }
    }

    setTabs(
      tabs.map((tab) => (tab.id === activeTabId ? { ...tab, url } : tab))
    );
    setUrlInput(url);
    setIsFocused(false);
  };

  const toggleDevTools = () => {
    const newState = !devToolsOpen;
    setDevToolsOpen(newState);

    if (newState) {
      webViewRefs.current[activeTabId]?.injectJavaScript(erudaInjectionScript);
    } else {
      webViewRefs.current[activeTabId]?.injectJavaScript(
        "if(window.eruda) eruda.hide(); true;"
      );
    }
  };

  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return "";
    }
  };

  const extractFavicon = (tabId: string) => {
    const isDark = colorScheme === "dark";
    const script = `
      (function() {
        const links = document.querySelectorAll('link[rel*="icon"]');
        let favicon = null;
        let fallbackFavicon = null;

        for (let link of links) {
          const media = link.getAttribute('media');
          const href = link.getAttribute('href');

          if (!href) continue;

          if (${isDark} && media && media.includes('dark')) {
            favicon = href;
            break;
          }
          else if (!${isDark} && media && media.includes('light')) {
            favicon = href;
            break;
          }
          else if (!media && !fallbackFavicon) {
            fallbackFavicon = href;
          }
        }

        const finalFavicon = favicon || fallbackFavicon;

        if (finalFavicon) {
          try {
            const url = new URL(finalFavicon, window.location.href);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'favicon',
              favicon: url.href
            }));
          } catch (e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'favicon',
              favicon: finalFavicon
            }));
          }
        }
      })();
      true;
    `;

    webViewRefs.current[tabId]?.injectJavaScript(script);
  };

  useEffect(() => {
    tabs.forEach((tab) => {
      if (!tab.loading) {
        extractFavicon(tab.id);
      }
    });
  }, [colorScheme]);

  const renderBrowserTab = useCallback(
    (
      tab: Tab,
      isActive: boolean,
      isLast: boolean,
      showDivider: boolean,
      targetWidth: number,
      onPress: () => void,
      onClose: () => void,
      isNew: boolean
    ) => (
      <AnimatedBrowserTab
        tab={tab}
        isActive={isActive}
        isLast={isLast}
        showDivider={showDivider}
        targetWidth={targetWidth}
        colors={colors}
        onPress={onPress}
        onClose={onClose}
        isNew={isNew}
        getFavicon={getFavicon}
      />
    ),
    [colors, getFavicon]
  );

  const handleTabPress = useCallback(
    (tabId: string) => {
      setActiveTabId(tabId);
      const tab = tabs.find((t) => t.id === tabId);
      if (tab) {
        setUrlInput(tab.url);
        setDevToolsOpen(false);
      }
    },
    [tabs]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.base }}>
      {/* Header */}
      <PluginHeader
        tabs={tabs}
        activeTabId={activeTabId}
        onTabPress={handleTabPress}
        onTabClose={closeTab}
        onNewTab={createNewTab}
        renderTab={renderBrowserTab}
        colors={colors}
        getTabWidth={getTabWidth}
      />

      {/* Navigation Bar */}
      {tabs.length > 0 && (
        <Animated.View
          layout={LinearTransition.duration(200).easing(Easing.ease)}
          style={{
            height: 52,
            paddingHorizontal: 6,
            flexDirection: "row",
            alignItems: "center",
            borderBottomWidth: 0.7,
            borderBottomColor: colors.bg.overlay,
            gap: 6,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              if (isFocused) {
                setIsFocused(false);
                urlInputRef.current?.blur();
              } else {
                webViewRefs.current[activeTabId]?.goBack();
              }
            }}
            disabled={!isFocused && !activeTab?.canGoBack}
            style={{
              width: 28,
              height: 28,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radius.md,
            }}
          >
            <ArrowLeft
              size={18}
              color={
                isFocused || activeTab?.canGoBack
                  ? colors.fg.default
                  : colors.fg.disabled
              }
              strokeWidth={2}
            />
          </TouchableOpacity>

          {!isFocused && (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              layout={LinearTransition.duration(200).easing(Easing.ease)}
              style={{ flexDirection: "row", gap: 6 }}
            >
              <TouchableOpacity
                onPress={() => webViewRefs.current[activeTabId]?.goForward()}
                disabled={!activeTab?.canGoForward}
                style={{
                  width: 28,
                  height: 28,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: radius.md,
                }}
              >
                <ArrowRight
                  size={18}
                  color={
                    activeTab?.canGoForward
                      ? colors.fg.default
                      : colors.fg.disabled
                  }
                  strokeWidth={2}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => webViewRefs.current[activeTabId]?.reload()}
                style={{
                  width: 28,
                  height: 28,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: radius.md,
                }}
              >
                <RotateCw size={18} color={colors.fg.default} strokeWidth={2} />
              </TouchableOpacity>
            </Animated.View>
          )}

          <Animated.View
            layout={LinearTransition.duration(200).easing(Easing.ease)}
            style={{
              flex: 1,
              height: 38,
              backgroundColor: colors.bg.raised,
              borderRadius: radius.md,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingLeft: 10,
              paddingRight: 8,
            }}
          >
            {!isFocused && (
              <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}
              >
                <Search
                  size={18}
                  color={colors.fg.muted}
                  strokeWidth={2}
                  style={{ marginRight: 4 }}
                />
              </Animated.View>
            )}

            <TextInput
              ref={urlInputRef}
              value={urlInput}
              onChangeText={setUrlInput}
              onSubmitEditing={handleUrlSubmit}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Search or enter website name"
              placeholderTextColor={colors.fg.muted}
              style={
                {
                  flex: 1,
                  color: colors.fg.default,
                  fontSize: 15,
                  height: 42,
                  outline: "none",
                } as any
              }
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              selectTextOnFocus={true}
              selection={isFocused ? undefined : { start: 0, end: 0 }}
              inputAccessoryViewID="browser_url_input"
            />

            <InputAccessoryView
              nativeID="browser_url_input"
              backgroundColor={colors.bg.base}
            >
              <View style={{ height: 0 }} />
            </InputAccessoryView>

            {isFocused && urlInput.length > 0 && (
              <TouchableOpacity
                onPress={() => setUrlInput("")}
                style={{
                  width: 24,
                  height: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: radius.full,
                  backgroundColor: colors.bg.base,
                }}
              >
                <X size={14} color={colors.fg.default} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </Animated.View>

          {!isFocused && (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              layout={LinearTransition.duration(200).easing(Easing.ease)}
            >
              <TouchableOpacity onPress={toggleDevTools}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: radius.sm,
                    padding: 4,
                    backgroundColor: devToolsOpen
                      ? colors.bg.raised
                      : colors.bg.base,
                  }}
                >
                  <Code size={20} color={colors.fg.default} strokeWidth={2} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      )}

      {/* WebView Container */}
      <View style={{ flex: 1, position: "relative" }}>
        {tabs.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Globe size={48} color={colors.fg.muted} strokeWidth={1.5} />
            <Text style={{ color: colors.fg.muted, fontSize: 16 }}>
              No tabs open
            </Text>
            <TouchableOpacity
              onPress={createNewTab}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.accent.default,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: radius.md,
                gap: 6,
                marginTop: 8,
              }}
            >
              <Plus size={18} color={colors.bg.base} strokeWidth={2} />
              <Text
                style={{
                  color: colors.bg.base,
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                Open New Tab
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          tabs.map((tab) => (
            <View
              key={tab.id}
              style={{
                flex: 1,
                display: activeTabId === tab.id ? "flex" : "none",
              }}
            >
              {tab.ready === false ? (
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <ActivityIndicator
                    size="large"
                    color={colors.accent.default}
                  />
                </View>
              ) : (
                <WebView
                  ref={(ref) => {
                    webViewRefs.current[tab.id] = ref;
                  }}
                  source={{ uri: tab.url }}
                  style={{ flex: 1 }}
                  originWhitelist={["*"]}
                  setSupportMultipleWindows={false}
                  hideKeyboardAccessoryView={true}
                  onShouldStartLoadWithRequest={() => true}
                  onNavigationStateChange={(navState) => {
                    if (tab.id === activeTabId && !isFocused) {
                      setUrlInput(navState.url);
                    }
                    setTabs((currentTabs) =>
                      currentTabs.map((t) =>
                        t.id === tab.id
                          ? {
                              ...t,
                              url: navState.url,
                              title: navState.title || t.title,
                              canGoBack: navState.canGoBack,
                              canGoForward: navState.canGoForward,
                              loading: navState.loading,
                            }
                          : t
                      )
                    );
                  }}
                  onLoadStart={() => {
                    setTabs((currentTabs) =>
                      currentTabs.map((t) =>
                        t.id === tab.id ? { ...t, loading: true } : t
                      )
                    );
                  }}
                  onLoadEnd={() => {
                    setTabs((currentTabs) =>
                      currentTabs.map((t) =>
                        t.id === tab.id ? { ...t, loading: false } : t
                      )
                    );
                    if (tab.id === activeTabId && devToolsOpen) {
                      webViewRefs.current[tab.id]?.injectJavaScript(
                        erudaInjectionScript
                      );
                    }
                    extractFavicon(tab.id);
                  }}
                  onMessage={(event) => {
                    try {
                      const data = JSON.parse(event.nativeEvent.data);
                      if (data.type === "favicon" && data.favicon) {
                        setTabs((currentTabs) =>
                          currentTabs.map((t) =>
                            t.id === tab.id
                              ? { ...t, favicon: data.favicon }
                              : t
                          )
                        );
                      }
                    } catch (e) {
                      // Ignore parsing errors
                    }
                  }}
                  injectedJavaScriptBeforeContentLoaded={
                    trustedTypesSetupScript
                  }
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  allowsInlineMediaPlayback={true}
                  mediaPlaybackRequiresUserAction={false}
                  startInLoadingState={true}
                  renderLoading={() => (
                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: colors.bg.base,
                      }}
                    >
                      <ActivityIndicator
                        size="large"
                        color={colors.accent.default}
                      />
                    </View>
                  )}
                />
              )}
            </View>
          ))
        )}
      </View>
    </View>
  );
}
