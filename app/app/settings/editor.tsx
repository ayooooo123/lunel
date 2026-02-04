import { useEditorConfig } from "@/contexts/EditorContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ChevronLeft, Minus, Plus } from "lucide-react-native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

function ToggleRow({ label, description, value, onValueChange }: ToggleRowProps) {
  const { colors, fonts, spacing } = useTheme();

  return (
    <View style={[styles.row, { paddingVertical: spacing[3], paddingHorizontal: spacing[4] }]}>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: colors.fg.default, fontFamily: fonts.sans.regular }]}>
          {label}
        </Text>
        {description && (
          <Text style={[styles.rowDescription, { color: colors.fg.muted, fontFamily: fonts.sans.regular }]}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.bg.overlay, true: colors.accent.default }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

interface StepperRowProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onValueChange: (value: number) => void;
}

function StepperRow({ label, description, value, min, max, step = 1, unit = "", onValueChange }: StepperRowProps) {
  const { colors, fonts, spacing, radius } = useTheme();

  const handleDecrement = () => {
    if (value > min) {
      onValueChange(value - step);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onValueChange(value + step);
    }
  };

  return (
    <View style={[styles.row, { paddingVertical: spacing[3], paddingHorizontal: spacing[4] }]}>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: colors.fg.default, fontFamily: fonts.sans.regular }]}>
          {label}
        </Text>
        {description && (
          <Text style={[styles.rowDescription, { color: colors.fg.muted, fontFamily: fonts.sans.regular }]}>
            {description}
          </Text>
        )}
      </View>
      <View style={styles.stepperContainer}>
        <TouchableOpacity
          onPress={handleDecrement}
          disabled={value <= min}
          style={[
            styles.stepperButton,
            {
              backgroundColor: colors.bg.overlay,
              borderRadius: radius.md,
              opacity: value <= min ? 0.4 : 1,
            },
          ]}
        >
          <Minus size={18} color={colors.fg.default} strokeWidth={2} />
        </TouchableOpacity>
        <Text
          style={[
            styles.stepperValue,
            { color: colors.fg.default, fontFamily: fonts.mono.medium, minWidth: 48 },
          ]}
        >
          {value}{unit}
        </Text>
        <TouchableOpacity
          onPress={handleIncrement}
          disabled={value >= max}
          style={[
            styles.stepperButton,
            {
              backgroundColor: colors.bg.overlay,
              borderRadius: radius.md,
              opacity: value >= max ? 0.4 : 1,
            },
          ]}
        >
          <Plus size={18} color={colors.fg.default} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function EditorSettingsPage() {
  const { colors, fonts, radius, spacing, isDark } = useTheme();
  const { config, updateConfig } = useEditorConfig();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bg.base }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { borderRadius: radius.md }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={24} color={colors.fg.default} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.fg.default, fontFamily: fonts.sans.semibold }]}>
          Editor
        </Text>
        <View style={styles.rightPlaceholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Font Section */}
        <Text style={[styles.sectionHeader, { color: colors.fg.muted, fontFamily: fonts.sans.medium }]}>
          FONT
        </Text>
        <View style={[styles.section, { backgroundColor: colors.bg.raised, borderRadius: radius.lg }]}>
          <StepperRow
            label="Font Size"
            description="Size of text in the editor"
            value={config.fontSize}
            min={10}
            max={24}
            step={1}
            unit="px"
            onValueChange={(value) => updateConfig("fontSize", value)}
          />
        </View>

        {/* Display Section */}
        <Text style={[styles.sectionHeader, { color: colors.fg.muted, fontFamily: fonts.sans.medium }]}>
          DISPLAY
        </Text>
        <View style={[styles.section, { backgroundColor: colors.bg.raised, borderRadius: radius.lg }]}>
          <ToggleRow
            label="Line Numbers"
            description="Show line numbers in the gutter"
            value={config.showLineNumbers}
            onValueChange={(value) => updateConfig("showLineNumbers", value)}
          />
          <View style={[styles.divider, { backgroundColor: colors.bg.overlay }]} />
          <ToggleRow
            label="Highlight Current Line"
            description="Highlight the line where the cursor is"
            value={config.highlightCurrentLine}
            onValueChange={(value) => updateConfig("highlightCurrentLine", value)}
          />
          <View style={[styles.divider, { backgroundColor: colors.bg.overlay }]} />
          <ToggleRow
            label="Word Wrap"
            description="Wrap long lines to fit the screen"
            value={config.wordWrap}
            onValueChange={(value) => updateConfig("wordWrap", value)}
          />
        </View>

        {/* Editing Section */}
        <Text style={[styles.sectionHeader, { color: colors.fg.muted, fontFamily: fonts.sans.medium }]}>
          EDITING
        </Text>
        <View style={[styles.section, { backgroundColor: colors.bg.raised, borderRadius: radius.lg }]}>
          <StepperRow
            label="Tab Size"
            description="Number of spaces per tab"
            value={config.tabSize}
            min={2}
            max={8}
            step={2}
            onValueChange={(value) => updateConfig("tabSize", value)}
          />
        </View>

        {/* Bottom padding */}
        <View style={{ height: spacing[8] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    height: 56,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
  },
  rightPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 12,
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  section: {
    marginHorizontal: 16,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowText: {
    flex: 1,
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 16,
  },
  rowDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginLeft: 16,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stepperButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    fontSize: 15,
    textAlign: "center",
  },
});
