import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useTheme } from "@/contexts/ThemeContext";
import { ChevronLeft } from "lucide-react-native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ThemePage() {
  const { colors, fonts, radius, isDark } = useTheme();
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
          Theme
        </Text>
        <View style={styles.rightPlaceholder} />
      </View>

      {/* Theme Switcher */}
      <ThemeSwitcher />
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
});
