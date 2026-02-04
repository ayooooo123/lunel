import { useTheme } from "@/contexts/ThemeContext";
import { ChevronRight, ChevronLeft, LucideIcon, Palette, Type, Grid3x3, Code, Folder } from "lucide-react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface SettingsRowProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}

function SettingsRow({ icon: Icon, label, onPress }: SettingsRowProps) {
  const { colors, fonts, radius, spacing } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.settingsRow, { paddingVertical: spacing[3], paddingHorizontal: spacing[4] }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.accent.subtle, borderRadius: radius.md }]}>
          <Icon size={18} color={colors.accent.default} strokeWidth={2} />
        </View>
        <Text style={[styles.rowLabel, { color: colors.fg.default, fontFamily: fonts.sans.regular }]}>
          {label}
        </Text>
      </View>
      <ChevronRight size={20} color={colors.fg.subtle} strokeWidth={2} />
    </TouchableOpacity>
  );
}

export default function SettingsPage() {
  const { colors, fonts, radius, spacing, isDark } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

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
          Settings
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Appearance Section */}
        <Text style={[styles.sectionHeader, { color: colors.fg.muted, fontFamily: fonts.sans.medium }]}>
          APPEARANCE
        </Text>
        <View style={[styles.section, { backgroundColor: colors.bg.raised, borderRadius: radius.lg }]}>
          <SettingsRow
            icon={Palette}
            label="Theme"
            onPress={() => router.push("/settings/appearance/theme")}
          />
          <View style={[styles.divider, { backgroundColor: colors.bg.overlay }]} />
          <SettingsRow
            icon={Type}
            label="Fonts"
            onPress={() => router.push("/settings/appearance/fonts")}
          />
          <View style={[styles.divider, { backgroundColor: colors.bg.overlay }]} />
          <SettingsRow
            icon={Grid3x3}
            label="Customize Bottom Bar"
            onPress={() => router.push("/settings/bottom-bar")}
          />
        </View>

        {/* Editor Section */}
        <Text style={[styles.sectionHeader, { color: colors.fg.muted, fontFamily: fonts.sans.medium }]}>
          EDITOR
        </Text>
        <View style={[styles.section, { backgroundColor: colors.bg.raised, borderRadius: radius.lg }]}>
          <SettingsRow
            icon={Code}
            label="Editor Settings"
            onPress={() => router.push("/settings/editor")}
          />
        </View>

        {/* Debug Section */}
        <Text style={[styles.sectionHeader, { color: colors.fg.muted, fontFamily: fonts.sans.medium }]}>
          DEBUG
        </Text>
        <View style={[styles.section, { backgroundColor: colors.bg.raised, borderRadius: radius.lg }]}>
          <SettingsRow
            icon={Folder}
            label="Storage Explorer"
            onPress={() => router.push("/settings/storage")}
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
  placeholder: {
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
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    marginLeft: 56,
  },
});
