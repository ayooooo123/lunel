import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export function Footer() {
  const handleVersionPress = () => {
    Linking.openURL("https://github.com/lunel-dev");
  };

  const handleSupportPress = () => {
    Linking.openURL("");
  };

  const handleContactPress = () => {
    Linking.openURL("");
  };

  return (
    <View style={styles.footer}>
      <TouchableOpacity onPress={handleVersionPress}>
        <Text style={styles.footerText}>v1.0.0</Text>
      </TouchableOpacity>
      <Text style={styles.footerDivider}> · </Text>
      <TouchableOpacity onPress={handleSupportPress}>
        <Text style={styles.footerText}>Support</Text>
      </TouchableOpacity>
      <Text style={styles.footerDivider}> · </Text>
      <TouchableOpacity onPress={handleContactPress}>
        <Text style={styles.footerText}>Contact</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: {
    color: "#6b7280",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  footerDivider: {
    color: "#6b7280",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
