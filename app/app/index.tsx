import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { isLoggedIn, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bg.base,
        }}
      >
        <ActivityIndicator size="large" color={colors.accent.default} />
      </View>
    );
  }

  if (isLoggedIn) {
    return <Redirect href="/workspace" />;
  }

  return <Redirect href="/auth" />;
}
