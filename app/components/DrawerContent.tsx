import { useTheme } from "@/contexts/ThemeContext";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { useRouter, usePathname } from "expo-router";
import { HelpCircle, Home, Settings, Info } from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image, SafeAreaView } from "react-native";
import HelpModal from "./HelpModal";

export default function DrawerContent(props: DrawerContentComponentProps) {
  const { colors, fonts, spacing, radius } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [helpVisible, setHelpVisible] = useState(false);

  const handleNavigation = (path: string) => {
    props.navigation.closeDrawer();
    router.push(path as any);
  };

  const handleHelp = () => {
    props.navigation.closeDrawer();
    setHelpVisible(true);
  };

  const DrawerItem = ({
    icon: Icon,
    label,
    onPress,
    isActive,
    isDestructive = false
  }: {
    icon: any,
    label: string,
    onPress: () => void,
    isActive?: boolean,
    isDestructive?: boolean
  }) => {
    const activeBg = colors.accent.subtle; // Light tint for active
    const activeFg = colors.accent.default;
    
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[
          styles.menuItem,
          {
            paddingVertical: spacing[3],
            paddingHorizontal: spacing[4],
            backgroundColor: isActive ? activeBg : "transparent",
            borderRadius: radius.md,
          }
        ]}
      >
        <Icon
          size={20}
          color={
            isActive ? activeFg :
            isDestructive ? colors.status.error :
            colors.fg.muted
          }
          strokeWidth={2}
        />
        <Text
          style={[
            styles.menuItemText,
            {
              fontFamily: isActive ? fonts.sans.semibold : fonts.sans.medium,
              color: isActive ? activeFg :
                     isDestructive ? colors.status.error :
                     colors.fg.default
            }
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.base }]}>
        <View style={{ flex: 1, paddingHorizontal: spacing[4] }}>
          {/* Header */}
          <View style={[styles.header, { marginBottom: spacing[6], marginTop: spacing[5] }]}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={{ width: 32, height: 32, borderRadius: radius.md }}
            />
            <Text
              style={[
                styles.headerTitle,
                { color: colors.fg.default, fontFamily: fonts.sans.bold, marginLeft: 12 },
              ]}
            >
              Lunel
            </Text>
          </View>

          {/* Main Menu */}
          <View style={styles.menuList}>
            <DrawerItem
              label="Home"
              icon={Home}
              onPress={() => handleNavigation("/")}
              isActive={pathname === "/"}
            />
            <DrawerItem
              label="Settings"
              icon={Settings}
              onPress={() => handleNavigation("/settings")}
              isActive={pathname.startsWith("/settings")}
            />
          </View>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Footer */}
          <View style={{ marginBottom: spacing[4] }}>
            <DrawerItem
              label="Help & Information"
              icon={HelpCircle}
              onPress={handleHelp}
            />
          </View>
        </View>
      </SafeAreaView>

      {/* Help Modal */}
      <HelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />
    </>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 24,
  },
  menuList: {
    gap: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
  },
});
