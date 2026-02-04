import { useTheme } from "@/contexts/ThemeContext";
import {
  NormalFamilyId,
  normalFamilies,
} from "@/constants/themes";
import { ChevronLeft, Check } from "lucide-react-native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface FontOptionProps {
  name: string;
  sampleText: string;
  fontFamily: string;
  isSelected: boolean;
  onSelect: () => void;
}

function FontOption({ name, sampleText, fontFamily, isSelected, onSelect }: FontOptionProps) {
  const { colors, fonts, spacing, radius } = useTheme();

  return (
    <TouchableOpacity
      onPress={onSelect}
      style={[
        styles.fontOption,
        {
          backgroundColor: isSelected ? colors.accent.subtle : colors.bg.raised,
          borderRadius: radius.lg,
          padding: spacing[4],
          marginBottom: spacing[3],
        },
      ]}
    >
      <View style={styles.fontOptionHeader}>
        <Text
          style={{
            fontSize: 16,
            fontFamily: fonts.sans.semibold,
            color: isSelected ? colors.accent.default : colors.fg.default,
          }}
        >
          {name}
        </Text>
        {isSelected && (
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: radius.full,
              backgroundColor: colors.accent.default,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Check size={16} color={colors.accent.fg} strokeWidth={3} />
          </View>
        )}
      </View>
      <Text
        style={{
          fontSize: 18,
          fontFamily: fontFamily,
          color: colors.fg.muted,
          marginTop: spacing[2],
        }}
      >
        {sampleText}
      </Text>
    </TouchableOpacity>
  );
}

export default function NormalFontPage() {
  const {
    colors,
    fonts,
    spacing,
    radius,
    isDark,
    fontSelection,
    setNormalFont,
  } = useTheme();
  const router = useRouter();

  const normalFontIds = Object.keys(normalFamilies) as NormalFamilyId[];

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
          Normal Font
        </Text>
        <View style={styles.rightPlaceholder} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Text
          style={{
            fontSize: 13,
            fontFamily: fonts.sans.regular,
            color: colors.fg.subtle,
            marginBottom: spacing[3],
            paddingHorizontal: spacing[4],
          }}
        >
          Used for UI text, labels, and general content
        </Text>

        <View style={{ paddingHorizontal: spacing[4] }}>
          {normalFontIds.map((id) => {
            const family = normalFamilies[id];
            return (
              <FontOption
                key={id}
                name={family.name}
                sampleText="The quick brown fox jumps over the lazy dog"
                fontFamily={family.regular}
                isSelected={fontSelection.normal === id}
                onSelect={() => setNormalFont(id)}
              />
            );
          })}
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
  fontOption: {
    flexDirection: "column",
  },
  fontOptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
