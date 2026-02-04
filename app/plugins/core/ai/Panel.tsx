import PluginHeader, { BaseTab } from "@/components/PluginHeader";
import { useTheme } from "@/contexts/ThemeContext";
import { Sparkles, ChevronUp, ChevronDown, Check, X, Plus, Image as ImageIcon, ArrowUp, Hammer, Map } from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import {
  Image,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { PluginPanelProps } from "../../types";

// Session tab interface
interface AITab extends BaseTab {}

// Model options
type ModelType = "claude-opus" | "claude-sonnet" | "gpt-4o" | "gemini-pro";
type ModeType = "build" | "plan";

const MODEL_OPTIONS: { id: ModelType; name: string }[] = [
  { id: "claude-opus", name: "Claude Opus" },
  { id: "claude-sonnet", name: "Claude Sonnet" },
  { id: "gpt-4o", name: "GPT-4o" },
  { id: "gemini-pro", name: "Gemini Pro" },
];

const MODE_OPTIONS: { id: ModeType; name: string; icon: React.ComponentType<any> }[] = [
  { id: "build", name: "Build", icon: Hammer },
  { id: "plan", name: "Plan", icon: Map },
];

// Dropdown component
function Dropdown({
  label,
  icon,
  options,
  selectedId,
  onSelect,
  isOpen,
  onToggle,
  colors,
  radius,
  width,
}: {
  label: string;
  icon?: React.ComponentType<any>;
  options: { id: string; name: string; icon?: React.ComponentType<any> }[];
  selectedId: string;
  onSelect: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  colors: any;
  radius: any;
  width: number;
}) {
  const selected = options.find((o) => o.id === selectedId);

  return (
    <View style={[styles.dropdownWrapper, { width }]}>
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          { backgroundColor: colors.bg.overlay, width, borderRadius: radius.sm },
        ]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        {icon && React.createElement(icon, {
          size: 14,
          color: colors.fg.muted,
          strokeWidth: 2,
          style: { marginRight: 6 }
        })}
        <Text
          style={[styles.dropdownButtonText, { color: colors.fg.default }]}
          numberOfLines={1}
        >
          {selected?.name || label}
        </Text>
        <View style={{ flex: 1 }} />
        {isOpen ? (
          <ChevronUp size={12} color={colors.fg.muted} strokeWidth={2} />
        ) : (
          <ChevronDown size={12} color={colors.fg.muted} strokeWidth={2} />
        )}
      </TouchableOpacity>

      {isOpen && (
        <View
          style={[
            styles.dropdownMenu,
            {
              backgroundColor: colors.bg.raised,
              borderColor: colors.bg.overlay,
              borderRadius: radius.sm,
              width,
            },
          ]}
        >
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.dropdownItem,
                selectedId === option.id && {
                  backgroundColor: colors.bg.overlay,
                },
              ]}
              onPress={() => {
                onSelect(option.id);
                onToggle();
              }}
            >
              {option.icon && React.createElement(option.icon, {
                size: 14,
                color: selectedId === option.id ? colors.accent.default : colors.fg.muted,
                strokeWidth: 2,
                style: { marginRight: 8 }
              })}
              <Text
                style={[
                  styles.dropdownItemText,
                  {
                    color:
                      selectedId === option.id
                        ? colors.accent.default
                        : colors.fg.default,
                  },
                ]}
              >
                {option.name}
              </Text>
              {selectedId === option.id && (
                <Check
                  size={14}
                  color={colors.accent.default}
                  strokeWidth={3}
                  style={{ marginLeft: "auto" }}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// Main AI Panel
export default function AIPanel({ instanceId, isActive }: PluginPanelProps) {
  const { colors, radius, fonts } = useTheme();

  // Tab state
  const [tabs, setTabs] = useState<AITab[]>([
    { id: "1", title: "Session 1" },
  ]);
  const [activeTabId, setActiveTabId] = useState("1");

  // UI state
  const [inputText, setInputText] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelType>("claude-sonnet");
  const [mode, setMode] = useState<ModeType>("build");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [inputHeight, setInputHeight] = useState(42);

  // Refs
  const inputRef = useRef<TextInput>(null);

  // Tab management
  const getTabWidth = useCallback(() => {
    return 120;
  }, []);

  const createNewTab = () => {
    const newId = Date.now().toString();
    const newTab: AITab = {
      id: newId,
      title: `Session ${tabs.length + 1}`,
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
    setInputText("");
  };

  const closeTab = (tabId: string) => {
    const newTabs = tabs.filter((tab) => tab.id !== tabId);
    setTabs(newTabs);

    if (activeTabId === tabId && newTabs.length > 0) {
      const index = tabs.findIndex((t) => t.id === tabId);
      const newActiveTab = newTabs[Math.max(0, index - 1)];
      setActiveTabId(newActiveTab.id);
    }
  };

  const handleTabPress = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  // Send message
  const sendMessage = async () => {
    if (!inputText.trim()) return;
    // TODO: Implement AI backend
    setInputText("");
    setInputHeight(42);
    Keyboard.dismiss();
  };

  // Tab renderer
  const renderAITab = useCallback(
    (
      tab: AITab,
      isActive: boolean,
      isLast: boolean,
      showDivider: boolean,
      targetWidth: number,
      onPress: () => void,
      onClose: () => void,
      isNew: boolean
    ) => (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[
          styles.tab,
          {
            width: targetWidth,
            backgroundColor: isActive ? colors.bg.base : "transparent",
            borderColor: isActive ? colors.bg.overlay : "transparent",
            borderRadius: radius.sm,
            marginRight: isLast ? 0 : 2,
          },
        ]}
      >
        {showDivider && (
          <View
            style={[styles.divider, { backgroundColor: colors.bg.overlay }]}
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
          <Sparkles
            size={16}
            color={isActive ? colors.fg.default : colors.fg.muted}
            strokeWidth={2}
            style={{ marginRight: 8 }}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.tabTitle,
              { color: isActive ? colors.fg.default : colors.fg.muted },
            ]}
          >
            {tab.title}
          </Text>
        </View>

        {isActive && (
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: colors.bg.raised, borderRadius: radius.full }]}
          >
            <X size={12} color={colors.fg.default} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    ),
    [colors, radius]
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
        renderTab={renderAITab}
        colors={colors}
        getTabWidth={getTabWidth}
      />

      {/* Content */}
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
            <Sparkles
              size={48}
              color={colors.fg.muted}
              strokeWidth={1.5}
            />
            <Text style={{ color: colors.fg.muted, fontSize: 16 }}>
              No AI sessions open
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
              <Plus size={18} color={colors.accent.fg} strokeWidth={2} />
              <Text
                style={{
                  color: colors.accent.fg,
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                New Session
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flex: 1, justifyContent: "flex-end" }}>
            {/* Logo in center */}
            <View style={styles.logoContainer}>
              <View style={styles.logoWrapper}>
                <Image
                  source={require("@/assets/opencode-wordmark-simple-dark.png")}
                  style={[styles.logo, { tintColor: colors.fg.default }]}
                  resizeMode="contain"
                />
                <Text style={[styles.versionText, { color: colors.fg.subtle, fontFamily: fonts.mono.regular }]}>v1.1.28</Text>
              </View>
              <View style={styles.promptButtonsContainer}>
                <TouchableOpacity
                  style={[styles.promptButton, { borderColor: colors.bg.overlay, borderRadius: radius.sm }]}
                  onPress={() => setInputText("Explain the structure of this codebase")}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.promptButtonText, { color: colors.fg.muted, fontFamily: fonts.mono.regular }]}>Explain the structure of this codebase</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.promptButton, { borderColor: colors.bg.overlay, borderRadius: radius.sm }]}
                  onPress={() => setInputText("Find and fix the bug causing the error in @")}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.promptButtonText, { color: colors.fg.muted, fontFamily: fonts.mono.regular }]}>Find and fix the bug causing the error in @</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.promptButton, { borderColor: colors.bg.overlay, borderRadius: radius.sm }]}
                  onPress={() => setInputText("Write unit tests with full coverage for @")}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.promptButtonText, { color: colors.fg.muted, fontFamily: fonts.mono.regular }]}>Write unit tests with full coverage for @</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Options bar */}
            <View style={styles.optionsBar}>
              {/* Mode dropdown */}
              <Dropdown
                label="Mode"
                icon={MODE_OPTIONS.find((m) => m.id === mode)?.icon}
                options={MODE_OPTIONS}
                selectedId={mode}
                onSelect={(id) => setMode(id as ModeType)}
                isOpen={isModeDropdownOpen}
                onToggle={() => {
                  setIsModelDropdownOpen(false);
                  setIsModeDropdownOpen(!isModeDropdownOpen);
                }}
                colors={colors}
                radius={radius}
                width={100}
              />

              {/* Model dropdown */}
              <Dropdown
                label="Model"
                icon={Sparkles}
                options={MODEL_OPTIONS}
                selectedId={selectedModel}
                onSelect={(id) => setSelectedModel(id as ModelType)}
                isOpen={isModelDropdownOpen}
                onToggle={() => {
                  setIsModeDropdownOpen(false);
                  setIsModelDropdownOpen(!isModelDropdownOpen);
                }}
                colors={colors}
                radius={radius}
                width={140}
              />

              <View style={{ flex: 1 }} />

              {/* Image button */}
              <TouchableOpacity
                style={[
                  styles.imageButton,
                  { backgroundColor: colors.bg.overlay, borderRadius: radius.sm },
                ]}
                onPress={() => console.log("Image picker")}
                activeOpacity={0.7}
              >
                <ImageIcon size={18} color={colors.fg.muted} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Input area */}
            <View style={styles.inputContainer}>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.bg.overlay,
                    minHeight: inputHeight,
                    borderRadius: radius.sm,
                  },
                ]}
              >
                <TextInput
                  ref={inputRef}
                  style={[
                    styles.input,
                    {
                      color: colors.fg.default,
                      maxHeight: 150,
                    },
                  ]}
                  placeholder="Ask anything..."
                  placeholderTextColor={colors.fg.subtle}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  onContentSizeChange={(e) => {
                    const newHeight = Math.max(42, e.nativeEvent.contentSize.height + 16);
                    setInputHeight(Math.min(newHeight, 150));
                  }}
                  onSubmitEditing={sendMessage}
                  blurOnSubmit={false}
                />

                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    {
                      backgroundColor: inputText.trim()
                        ? colors.accent.default
                        : colors.bg.raised,
                      borderRadius: radius.sm,
                    },
                  ]}
                  onPress={sendMessage}
                  disabled={!inputText.trim()}
                  activeOpacity={0.7}
                >
                  <ArrowUp
                    size={18}
                    color={inputText.trim() ? colors.accent.fg : colors.fg.subtle}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Tab styles
  tab: {
    height: 35,
    marginBottom: 12,
    paddingLeft: 8,
    paddingRight: 6,
    borderWidth: 0.7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  divider: {
    position: "absolute",
    right: -2,
    width: 1,
    height: 20,
    top: 7,
  },
  tabTitle: {
    fontSize: 13,
    flex: 1,
  },
  closeButton: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },

  // Logo
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoWrapper: {
    position: "relative",
  },
  logo: {
    width: 320,
    height: 80,
  },
  versionText: {
    position: "absolute",
    bottom: 0,
    right: 0,
    fontSize: 10,
  },
  promptButtonsContainer: {
    marginTop: 24,
    width: 320,
    gap: 8,
  },
  promptButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  promptButtonText: {
    fontSize: 11,
  },

  // Options bar
  optionsBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },

  // Dropdown styles
  dropdownWrapper: {
    position: "relative",
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dropdownButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  dropdownMenu: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    borderWidth: 1,
    marginBottom: 2,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownItemText: {
    fontSize: 13,
  },

  // Image button
  imageButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  // Input styles
  inputContainer: {
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 6,
    maxHeight: 150,
    textAlignVertical: "center",
  },
  sendButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
});
