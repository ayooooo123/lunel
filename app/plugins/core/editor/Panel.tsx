import CodeMirrorEditor, {
  CodeMirrorEditorHandle,
} from "@/components/editor/CodeMirrorEditor";
import { FILE_ICONS, SAMPLE_CODE } from "@/components/editor/types";
import { useEditorStore } from "@/components/editor/useEditorStore";
import PluginHeader, { BaseTab } from "@/components/PluginHeader";
import { radius } from "@/constants/themes";
import { useEditorConfig } from "@/contexts/EditorContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useConnection } from "@/contexts/ConnectionContext";
import { useApi } from "@/hooks/useApi";
import { FileText, X, Plus } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { memo, useCallback, useEffect, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { PluginPanelProps } from "../../types";

const AUTOSAVE_DELAY = 1000; // 1 second debounce

interface EditorTab extends BaseTab {
  fileName: string;
  language: string;
  content: string;
  isModified: boolean;
}

const springConfig = {
  damping: 20,
  stiffness: 200,
  mass: 0.8,
};

const getFileIcon = (language: string): string => {
  return (FILE_ICONS as any)[language] || "document";
};

const AnimatedEditorTab = memo(
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
  }: {
    tab: EditorTab;
    isActive: boolean;
    isLast: boolean;
    showDivider: boolean;
    targetWidth: number;
    colors: any;
    onPress: () => void;
    onClose: () => void;
    isNew: boolean;
  }) => {
    const width = useSharedValue(isNew ? 0 : targetWidth);
    const opacity = useSharedValue(isNew ? 0 : 1);
    const scale = useSharedValue(1);
    const isFirstMount = useRef(true);

    useEffect(() => {
      if (isFirstMount.current) {
        isFirstMount.current = false;
        return;
      }

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
            <Ionicons
              name={getFileIcon(tab.language) as any}
              size={16}
              color={isActive ? colors.fg.default : colors.fg.muted}
              style={{ marginRight: 6 }}
            />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 13,
                color: isActive ? colors.fg.default : colors.fg.muted,
                flex: 1,
              }}
            >
              {tab.fileName}
            </Text>
            {tab.isModified && (
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: radius.full,
                  marginLeft: 4,
                  backgroundColor: colors.accent.default,
                }}
              />
            )}
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
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={14} color={colors.fg.default} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

export default function EditorPanel({
  instanceId,
  isActive,
}: PluginPanelProps) {
  const { colors, radius, isDark, fontSelection } = useTheme();
  const { status } = useConnection();
  const { fs } = useApi();
  const isConnected = status === 'connected';

  // Imperative store - only re-renders on tab list/active changes
  const {
    tabs,
    activeTabId,
    activeTab,
    createTab,
    closeTab,
    setActiveTab,
    setContent,
    markSavedWithContent,
  } = useEditorStore();

  // Ref to CodeMirror editor
  const editorRef = useRef<CodeMirrorEditorHandle>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef<string>('');
  const pendingContentRef = useRef<string | null>(null);

  // Editor config from context (persisted)
  const { config } = useEditorConfig();

  // Autosave function
  const saveFile = useCallback(async (tabId: string, filePath: string, content: string) => {
    if (!isConnected || !filePath) return;

    try {
      await fs.write(filePath, content);
      markSavedWithContent(tabId, content);
      lastSavedContentRef.current = content;
    } catch (err) {
      console.error('Autosave failed:', err);
    }
  }, [isConnected, fs, markSavedWithContent]);

  // Handle content change from editor
  const handleContentChange = useCallback((content: string) => {
    if (!activeTabId) return;

    // Update store content without triggering re-render
    setContent(activeTabId, content, false);
    pendingContentRef.current = content;

    // Clear existing timer
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    // Get current tab info for saving
    const tab = activeTab;
    if (!tab || !tab.filePath || !isConnected) return;

    // Check if content matches original (no need to save)
    if (content === tab.originalContent) return;
    if (content === lastSavedContentRef.current) return;

    // Debounced save
    autosaveTimerRef.current = setTimeout(() => {
      if (tab.filePath && pendingContentRef.current !== null) {
        saveFile(tab.id, tab.filePath, pendingContentRef.current);
        pendingContentRef.current = null;
      }
    }, AUTOSAVE_DELAY);
  }, [activeTabId, activeTab, isConnected, setContent, saveFile]);

  // Cleanup autosave timer on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  // Initialize with a default tab if empty
  useEffect(() => {
    if (tabs.length === 0) {
      createTab("index.js", "javascript", SAMPLE_CODE);
    }
  }, []);

  // Focus editor when panel becomes active and sync lastSavedContentRef
  useEffect(() => {
    if (isActive && activeTab) {
      // If this file is from disk, set lastSavedContentRef to original content
      if (activeTab.filePath) {
        lastSavedContentRef.current = activeTab.originalContent;
      }
      const timer = setTimeout(() => {
        editorRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isActive, activeTabId, activeTab]);

  // Tab handlers
  const handleTabPress = useCallback(
    (tabId: string) => {
      setActiveTab(tabId);
    },
    [setActiveTab]
  );

  const handleTabClose = useCallback(
    (tabId: string) => {
      closeTab(tabId);
    },
    [closeTab]
  );

  const handleNewTab = useCallback(() => {
    const count = tabs.length + 1;
    createTab(`untitled-${count}.js`, "javascript", "");
  }, [tabs.length, createTab]);

  const tabsForUI: EditorTab[] = tabs.map((t) => ({
    id: t.id,
    title: t.fileName,
    fileName: t.fileName,
    language: t.language,
    content: t.content,
    isModified: t.isModified,
  }));

  const getTabWidth = useCallback((count: number) => {
    return 120;
  }, []);

  const renderEditorTab = useCallback(
    (
      tab: EditorTab,
      isActive: boolean,
      isLast: boolean,
      showDivider: boolean,
      targetWidth: number,
      onPress: () => void,
      onClose: () => void,
      isNew: boolean
    ) => (
      <AnimatedEditorTab
        tab={tab}
        isActive={isActive}
        isLast={isLast}
        showDivider={showDivider}
        targetWidth={targetWidth}
        colors={colors}
        onPress={onPress}
        onClose={onClose}
        isNew={isNew}
      />
    ),
    [colors]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.base }]}>
      {/* Header */}
      <PluginHeader
        tabs={tabsForUI}
        activeTabId={activeTabId ?? ""}
        onTabPress={handleTabPress}
        onTabClose={handleTabClose}
        onNewTab={handleNewTab}
        renderTab={renderEditorTab}
        colors={colors}
        getTabWidth={getTabWidth}
      />

      {/* Code Editor Area */}
      <View style={styles.editorArea}>
        {activeTab ? (
          <CodeMirrorEditor
            key={activeTabId}
            ref={editorRef}
            initialContent={activeTab.content}
            language={activeTab.language}
            colors={colors}
            isDark={isDark}
            config={config}
            monoFont={fontSelection.mono}
            onChange={handleContentChange}
          />
        ) : (
          <View
            style={[styles.emptyState, { backgroundColor: colors.bg.base }]}
          >
            <FileText
              size={48}
              color={colors.fg.muted}
              strokeWidth={1.5}
            />
            <Text style={{ color: colors.fg.muted, fontSize: 16 }}>
              No files open
            </Text>
            <TouchableOpacity
              onPress={handleNewTab}
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
                Create New File
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  editorArea: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
});
