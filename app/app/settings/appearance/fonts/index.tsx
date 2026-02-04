import { useTheme } from "@/contexts/ThemeContext";
import {
  displayFamilies,
  monoFamilies,
  normalFamilies,
} from "@/constants/themes";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface FontRowProps {
  label: string;
  currentFont: string;
  onPress: () => void;
}

function FontRow({ label, currentFont, onPress }: FontRowProps) {
  const { colors, fonts, radius, spacing } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.fontRow, { paddingVertical: spacing[3], paddingHorizontal: spacing[4] }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <Text style={[styles.rowLabel, { color: colors.fg.default, fontFamily: fonts.sans.regular }]}>
          {label}
        </Text>
        <Text style={[styles.currentFont, { color: colors.fg.muted, fontFamily: fonts.sans.regular }]}>
          {currentFont}
        </Text>
      </View>
      <ChevronRight size={20} color={colors.fg.subtle} strokeWidth={2} />
    </TouchableOpacity>
  );
}

export default function FontsPage() {
  const {
    colors,
    fonts,
    spacing,
    radius,
    isDark,
    fontSelection,
  } = useTheme();
  const router = useRouter();

  const currentNormalName = normalFamilies[fontSelection.normal]?.name ?? "Default";
  const currentMonoName = monoFamilies[fontSelection.mono]?.name ?? "Default";
  const currentDisplayName = displayFamilies[fontSelection.display]?.name ?? "Default";

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.bg.base,
            marginBottom: spacing[2],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { borderRadius: radius.md }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={24} color={colors.fg.default} strokeWidth={2} />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.fg.default, fontFamily: fonts.sans.semibold },
          ]}
        >
          Fonts
        </Text>
        <View style={styles.rightPlaceholder} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: colors.bg.raised, borderRadius: radius.lg, marginHorizontal: spacing[4] }]}>
          <FontRow
            label="Normal Font"
            currentFont={currentNormalName}
            onPress={() => router.push("/settings/appearance/fonts/normal")}
          />
          <View style={[styles.divider, { backgroundColor: colors.bg.overlay }]} />
          <FontRow
            label="Code Font"
            currentFont={currentMonoName}
            onPress={() => router.push("/settings/appearance/fonts/code")}
          />
          <View style={[styles.divider, { backgroundColor: colors.bg.overlay }]} />
          <FontRow
            label="Display Font"
            currentFont={currentDisplayName}
            onPress={() => router.push("/settings/appearance/fonts/display")}
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
  section: {
    overflow: "hidden",
  },
  fontRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: {
    flexDirection: "column",
    gap: 2,
  },
  rowLabel: {
    fontSize: 16,
  },
  currentFont: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginLeft: 16,
  },
});
