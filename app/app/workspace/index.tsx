import { useTheme } from "@/contexts/ThemeContext";
import PluginBottomBar from "@/components/PluginBottomBar";
import PluginRenderer from "@/components/PluginRenderer";
import { usePlugins } from "@/plugins";
import { useEffect, useState } from "react";
import {
  Keyboard,
  View,
  ActivityIndicator,
} from "react-native";

export default function WorkspaceScreen() {
  const { colors } = useTheme();
  const { isLoading, openTab, setActiveTab } = usePlugins();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setIsKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg.base, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.accent.default} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.base }}>
      <PluginRenderer paddingBottom={isKeyboardVisible ? 0 : 82} />
      <PluginBottomBar
        isKeyboardVisible={isKeyboardVisible}
        openTab={openTab}
        setActiveTab={setActiveTab}
      />
    </View>
  );
}
