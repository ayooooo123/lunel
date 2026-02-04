import PluginHeader, { BaseTab } from "@/components/PluginHeader";
import { radius } from "@/constants/themes";
import { useTheme } from "@/contexts/ThemeContext";
// import { useConnection } from "@/contexts/ConnectionContext";
// import { useTerminal, TerminalState } from "@/hooks/useTerminal";
import { Terminal, X, Plus } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { PluginPanelProps } from "../../types";

// Terminal colors
const termColors = {
  black: '#1a1a1a',
  red: '#ff5f56',
  green: '#5af78e',
  yellow: '#f3f99d',
  blue: '#57c7ff',
  magenta: '#ff6ac1',
  cyan: '#9aedfe',
  white: '#f1f1f0',
  brightBlack: '#686868',
  brightGreen: '#5af78e',
  brightCyan: '#9aedfe',
  brightWhite: '#ffffff',
};

// Demo script - each item is a line or action
interface ScriptLine {
  type: 'prompt' | 'command' | 'output' | 'delay';
  content?: string;
  color?: string;
  delay?: number;
  parts?: { text: string; color: string }[];
}

const demoScript: ScriptLine[] = [
  // First command: ls
  {
    type: 'prompt',
    parts: [
      { text: 'gruz', color: termColors.green },
      { text: '@', color: termColors.white },
      { text: 'macbook-pro', color: termColors.magenta },
      { text: ' ', color: termColors.white },
      { text: '~/asap', color: termColors.cyan },
      { text: ' $ ', color: termColors.white },
    ],
  },
  { type: 'delay', delay: 800 },
  { type: 'command', content: 'ls', delay: 150 },
  { type: 'delay', delay: 600 },
  {
    type: 'output',
    parts: [
      { text: 'core', color: termColors.blue },
      { text: '         ', color: termColors.white },
      { text: 'node_modules', color: termColors.blue },
      { text: '   ', color: termColors.white },
      { text: 'pnpm-workspace.yaml', color: termColors.white },
    ],
  },
  {
    type: 'output',
    parts: [
      { text: 'docs', color: termColors.blue },
      { text: '         ', color: termColors.white },
      { text: 'package.json', color: termColors.white },
      { text: '   ', color: termColors.white },
      { text: 'README.md', color: termColors.white },
    ],
  },
  {
    type: 'output',
    parts: [
      { text: 'landing', color: termColors.blue },
      { text: '      ', color: termColors.white },
      { text: 'pnpm-lock.yaml', color: termColors.white },
      { text: ' ', color: termColors.white },
      { text: 'web', color: termColors.blue },
    ],
  },
  { type: 'output', content: '', color: termColors.white },
  { type: 'delay', delay: 1200 },

  // Second command: cd web
  {
    type: 'prompt',
    parts: [
      { text: 'gruz', color: termColors.green },
      { text: '@', color: termColors.white },
      { text: 'macbook-pro', color: termColors.magenta },
      { text: ' ', color: termColors.white },
      { text: '~/asap', color: termColors.cyan },
      { text: ' $ ', color: termColors.white },
    ],
  },
  { type: 'delay', delay: 500 },
  { type: 'command', content: 'cd web', delay: 100 },
  { type: 'delay', delay: 400 },
  { type: 'output', content: '', color: termColors.white },
  { type: 'delay', delay: 800 },

  // Third command: pnpm dev
  {
    type: 'prompt',
    parts: [
      { text: 'gruz', color: termColors.green },
      { text: '@', color: termColors.white },
      { text: 'macbook-pro', color: termColors.magenta },
      { text: ' ', color: termColors.white },
      { text: '~/asap/web', color: termColors.cyan },
      { text: ' $ ', color: termColors.white },
    ],
  },
  { type: 'delay', delay: 600 },
  { type: 'command', content: 'pnpm dev', delay: 120 },
  { type: 'delay', delay: 800 },
  {
    type: 'output',
    parts: [
      { text: 'web@0.0.0', color: termColors.white },
      { text: ' dev ', color: termColors.cyan },
      { text: '/Users/gruz/asap/web', color: termColors.brightBlack },
    ],
  },
  {
    type: 'output',
    parts: [
      { text: 'vite', color: termColors.magenta },
    ],
  },
  { type: 'delay', delay: 500 },
  { type: 'output', content: '', color: termColors.white },
  { type: 'output', content: '', color: termColors.white },
  {
    type: 'output',
    parts: [
      { text: '  VITE ', color: termColors.magenta },
      { text: 'v7.3.1', color: termColors.green },
      { text: '  ready in ', color: termColors.white },
      { text: '123 ms', color: termColors.yellow },
    ],
  },
  { type: 'output', content: '', color: termColors.white },
  {
    type: 'output',
    parts: [
      { text: '  ➜  ', color: termColors.green },
      { text: 'Local:   ', color: termColors.brightWhite },
      { text: 'http://localhost:5173/', color: termColors.cyan },
    ],
  },
  {
    type: 'output',
    parts: [
      { text: '  ➜  ', color: termColors.brightBlack },
      { text: 'Network: ', color: termColors.brightBlack },
      { text: 'use ', color: termColors.brightBlack },
      { text: '--host', color: termColors.brightWhite },
      { text: ' to expose', color: termColors.brightBlack },
    ],
  },
  {
    type: 'output',
    parts: [
      { text: '  ➜  ', color: termColors.brightBlack },
      { text: 'press ', color: termColors.brightBlack },
      { text: 'h + enter', color: termColors.brightWhite },
      { text: ' to show help', color: termColors.brightBlack },
    ],
  },
];

interface TerminalLine {
  id: string;
  parts: { text: string; color: string }[];
}

interface TerminalState {
  lines: TerminalLine[];
  currentLineIndex: number;
  currentCharIndex: number;
  isTyping: boolean;
}

const springConfig = {
  damping: 20,
  stiffness: 200,
  mass: 0.8,
};

interface TerminalTab extends BaseTab {
  // terminalId?: string;
  // state?: TerminalState;
  // shell?: string;
  // exited?: boolean;
  // exitCode?: number;
  demoState?: DemoState;
}

interface DemoState {
  lines: { id: string; parts: { text: string; color: string }[] }[];
  typingLine: { parts: { text: string; color: string }[] } | null;
  showCursor: boolean;
}

const AnimatedTerminalTab = memo(
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
    tab: TerminalTab;
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
            <Terminal
              size={16}
              color={isActive ? colors.fg.default : colors.fg.muted}
              strokeWidth={2}
              style={{ marginRight: 8 }}
            />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 13,
                color: isActive ? colors.fg.default : colors.fg.muted,
                flex: 1,
              }}
            >
              {tab.title}
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

// Demo terminal renderer
const DemoTerminal = memo(
  ({
    demoState,
    fontSize,
    lineHeight,
  }: {
    demoState?: DemoState;
    fontSize: number;
    lineHeight: number;
  }) => {
    if (!demoState) {
      return (
        <Text
          style={{
            fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
            fontSize,
            color: termColors.brightBlack,
          }}
        >
          Starting...
        </Text>
      );
    }

    return (
      <View>
        {/* Completed lines */}
        {demoState.lines.map((line) => (
          <View
            key={line.id}
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              minHeight: lineHeight,
            }}
          >
            {line.parts.map((part, partIndex) => (
              <Text
                key={partIndex}
                style={{
                  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                  fontSize,
                  lineHeight,
                  color: part.color,
                }}
              >
                {part.text}
              </Text>
            ))}
          </View>
        ))}
        {/* Currently typing line */}
        {demoState.typingLine && (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              minHeight: lineHeight,
            }}
          >
            {demoState.typingLine.parts.map((part, partIndex) => (
              <Text
                key={partIndex}
                style={{
                  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                  fontSize,
                  lineHeight,
                  color: part.color,
                }}
              >
                {part.text}
              </Text>
            ))}
            {demoState.showCursor && (
              <Text
                style={{
                  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                  fontSize,
                  lineHeight,
                  color: termColors.white,
                  backgroundColor: termColors.white,
                }}
              >
                {' '}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }
);

export default function TerminalPanel({
  instanceId,
  isActive,
}: PluginPanelProps) {
  const { colors, radius } = useTheme();
  // Disconnected from backend for now - demo mode
  // const { status } = useConnection();
  // const isConnected = status === 'connected';

  const [tabs, setTabs] = useState<TerminalTab[]>([]);
  const [activeTabId, setActiveTabId] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);

  // Terminal dimensions
  const fontSize = 13;
  const lineHeight = 18;

  const getTabWidth = useCallback(() => {
    return 120;
  }, []);

  // Demo playback function
  const playDemoScript = useCallback((tabId: string) => {
    let scriptIndex = 0;
    let charIndex = 0;
    let lineIdCounter = 0;
    let currentPromptParts: { text: string; color: string }[] = [];
    let currentTypingText = '';
    let currentTypingColor = termColors.white;
    let cursorVisible = true;
    // Keep local copy of lines to avoid stale state issues
    let localLines: { id: string; parts: { text: string; color: string }[] }[] = [];

    // Cursor blink interval
    const cursorInterval = setInterval(() => {
      cursorVisible = !cursorVisible;
      setTabs(prev => prev.map(t => {
        if (t.id !== tabId || !t.demoState) return t;
        return {
          ...t,
          demoState: {
            ...t.demoState,
            showCursor: cursorVisible,
          },
        };
      }));
    }, 530);

    const processNextStep = () => {
      if (scriptIndex >= demoScript.length) {
        clearInterval(cursorInterval);
        return;
      }

      const step = demoScript[scriptIndex];

      if (step.type === 'delay') {
        scriptIndex++;
        setTimeout(processNextStep, step.delay || 300);
        return;
      }

      if (step.type === 'prompt') {
        // Show prompt immediately
        currentPromptParts = [...(step.parts || [])];
        currentTypingText = '';
        setTabs(prev => prev.map(t => {
          if (t.id !== tabId) return t;
          return {
            ...t,
            demoState: {
              lines: [...localLines],
              typingLine: { parts: [...currentPromptParts] },
              showCursor: cursorVisible,
            },
          };
        }));
        scriptIndex++;
        setTimeout(processNextStep, 100);
        return;
      }

      if (step.type === 'command') {
        // Type out command character by character
        const command = step.content || '';
        const typeDelay = step.delay || 80;
        currentTypingColor = termColors.white;

        const typeNextChar = () => {
          if (charIndex >= command.length) {
            // Command finished typing, add newline and move to next step
            charIndex = 0;
            const newLine = {
              id: `line-${tabId}-${lineIdCounter++}`,
              parts: [...currentPromptParts, { text: currentTypingText, color: currentTypingColor }],
            };
            localLines = [...localLines, newLine];

            setTabs(prev => prev.map(t => {
              if (t.id !== tabId) return t;
              return {
                ...t,
                demoState: {
                  lines: [...localLines],
                  typingLine: null,
                  showCursor: cursorVisible,
                },
              };
            }));
            currentPromptParts = [];
            currentTypingText = '';
            scriptIndex++;
            setTimeout(processNextStep, 200);
            return;
          }

          currentTypingText += command[charIndex];
          charIndex++;

          setTabs(prev => prev.map(t => {
            if (t.id !== tabId) return t;
            return {
              ...t,
              demoState: {
                lines: [...localLines],
                typingLine: {
                  parts: [...currentPromptParts, { text: currentTypingText, color: currentTypingColor }],
                },
                showCursor: cursorVisible,
              },
            };
          }));

          // Scroll to bottom
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 10);

          // Random delay for realistic typing
          const variance = Math.random() * 60 - 30;
          setTimeout(typeNextChar, typeDelay + variance);
        };

        typeNextChar();
        return;
      }

      if (step.type === 'output') {
        // Output appears instantly
        const outputParts = step.parts || (step.content !== undefined ? [{ text: step.content, color: step.color || termColors.white }] : []);

        const newLine = {
          id: `line-${tabId}-${lineIdCounter++}`,
          parts: outputParts,
        };
        localLines = [...localLines, newLine];

        setTabs(prev => prev.map(t => {
          if (t.id !== tabId) return t;
          return {
            ...t,
            demoState: {
              lines: [...localLines],
              typingLine: null,
              showCursor: cursorVisible,
            },
          };
        }));

        // Scroll to bottom
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 10);

        scriptIndex++;
        setTimeout(processNextStep, 50);
        return;
      }
    };

    // Start the demo
    setTimeout(processNextStep, 800);

    return () => {
      clearInterval(cursorInterval);
    };
  }, []);

  const createNewTab = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newId = Date.now().toString();
    const newTab: TerminalTab = {
      id: newId,
      title: "Terminal",
      demoState: {
        lines: [],
        typingLine: null,
        showCursor: true,
      },
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);

    // Start demo playback
    setTimeout(() => playDemoScript(newId), 100);
  }, [playDemoScript]);

  const closeTab = useCallback((tabId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const newTabs = tabs.filter((t) => t.id !== tabId);
    setTabs(newTabs);

    if (activeTabId === tabId) {
      if (newTabs.length > 0) {
        const index = tabs.findIndex((t) => t.id === tabId);
        const newActiveTab = newTabs[Math.max(0, index - 1)];
        setActiveTabId(newActiveTab.id);
      } else {
        setActiveTabId("");
      }
    }
  }, [tabs, activeTabId]);

  const renderTerminalTab = useCallback(
    (
      tab: TerminalTab,
      isActive: boolean,
      isLast: boolean,
      showDivider: boolean,
      targetWidth: number,
      onPress: () => void,
      onClose: () => void,
      isNew: boolean
    ) => (
      <AnimatedTerminalTab
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
    <View style={{ flex: 1, backgroundColor: colors.bg.base }}>
      {/* Header */}
      <PluginHeader
        tabs={tabs}
        activeTabId={activeTabId}
        onTabPress={setActiveTabId}
        onTabClose={closeTab}
        onNewTab={createNewTab}
        renderTab={renderTerminalTab}
        colors={colors}
        getTabWidth={getTabWidth}
      />

      {/* Terminal Content */}
      <View style={{ flex: 1 }}>
        {tabs.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Terminal
              size={48}
              color={colors.fg.muted}
              strokeWidth={1.5}
            />
            <Text style={{ color: colors.fg.muted, fontSize: 16 }}>
              No terminals open
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
                Open New Terminal
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
              {/* Terminal Display */}
              <ScrollView
                ref={scrollViewRef}
                style={{
                  flex: 1,
                  backgroundColor: termColors.black,
                }}
                contentContainerStyle={{
                  padding: 12,
                  paddingBottom: 20,
                }}
              >
                <DemoTerminal
                  demoState={tab.demoState}
                  fontSize={fontSize}
                  lineHeight={lineHeight}
                />
              </ScrollView>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
