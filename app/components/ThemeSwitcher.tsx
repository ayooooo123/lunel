import {
  ThemeOption,
  themeDescriptions,
  themeLabels,
  themes,
  ThemeId,
} from "@/constants/themes";
import { useTheme } from "@/contexts/ThemeContext";
import { Check } from "lucide-react-native";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface ThemeCardData {
  id: ThemeOption;
  description: string;
  previewColors: string[];
}

// Get all available theme options
function getThemeOptions(): ThemeOption[] {
  const themeIds = Object.keys(themes) as ThemeId[];
  return ['device', ...themeIds];
}

export function ThemeSwitcher() {
  const { selectedTheme, setTheme, colors, fonts, radius, spacing } = useTheme();

  // Build theme options with preview colors
  const themeOptions: ThemeCardData[] = getThemeOptions().map((id) => {
    let previewColors: string[];

    if (id === "device") {
      // Show both light and dark colors for device theme
      previewColors = [
        themes.light.accent.default,
        themes.dark.accent.default,
        themes.light.bg.raised,
        themes.dark.bg.raised,
      ];
    } else {
      const theme = themes[id];
      previewColors = [
        theme.accent.default,
        theme.syntax.keyword,
        theme.syntax.string,
        theme.syntax.function,
      ];
    }

    return {
      id,
      description: themeDescriptions[id],
      previewColors,
    };
  });

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg.base, flex: 1 }}
      contentContainerStyle={{ padding: spacing[4] }}
    >
      {themeOptions.map((theme) => {
        const isSelected = selectedTheme === theme.id;

        return (
          <TouchableOpacity
            key={theme.id}
            onPress={() => setTheme(theme.id)}
            activeOpacity={0.7}
            style={{
              backgroundColor: isSelected ? colors.accent.subtle : colors.bg.raised,
              borderRadius: radius.lg,
              padding: spacing[4],
              marginBottom: spacing[3],
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.fg.default,
                    fontSize: 16,
                    fontFamily: fonts.sans.semibold,
                    marginBottom: spacing[1],
                  }}
                >
                  {themeLabels[theme.id]}
                </Text>

                <Text
                  style={{
                    color: colors.fg.muted,
                    fontSize: 13,
                    fontFamily: fonts.sans.regular,
                    lineHeight: 18,
                  }}
                >
                  {theme.description}
                </Text>
              </View>

              {isSelected && (
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: radius.full,
                    backgroundColor: colors.accent.default,
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: spacing[3],
                  }}
                >
                  <Check size={16} color={colors.accent.fg} strokeWidth={3} />
                </View>
              )}
            </View>

            {/* Color preview */}
            <View style={{ flexDirection: "row", gap: spacing[2], marginTop: spacing[3] }}>
              {theme.previewColors.map((color, index) => (
                <View
                  key={index}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: radius.full,
                    backgroundColor: color,
                    borderWidth: 1,
                    borderColor: colors.fg.subtle,
                  }}
                />
              ))}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
