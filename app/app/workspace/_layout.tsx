import { useTheme } from "@/contexts/ThemeContext";
import DrawerContent from "@/components/DrawerContent";
import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function WorkspaceLayout() {
  const { colors } = useTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <DrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerType: "front",
          drawerStyle: {
            backgroundColor: colors.bg.base,
            width: "75%",
          },
          overlayColor: "rgba(0, 0, 0, 0.5)",
          swipeEnabled: true,
          swipeEdgeWidth: 50,
        }}
      />
    </GestureHandlerRootView>
  );
}
