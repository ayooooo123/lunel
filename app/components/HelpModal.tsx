import { useTheme } from "@/contexts/ThemeContext";
import { ArrowLeft } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import React, { useState, useRef, useEffect } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function HelpModal({ visible, onClose }: HelpModalProps) {
  const { colors, fonts, spacing, isDark } = useTheme();

  const [modalVisible, setModalVisible] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible]);

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1 }}>
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            opacity: backdropOpacity,
          }}
        />
        <Animated.View style={[styles.container, { backgroundColor: colors.bg.base, transform: [{ translateY: slideAnim }] }]}>
          <SafeAreaView style={{ flex: 1 }}>
            <StatusBar style={isDark ? "light" : "dark"} />
            {/* Header - no border, using spacing */}
            <View style={[styles.header, { marginBottom: spacing[4] }]}>
              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <ArrowLeft size={24} color={colors.fg.default} strokeWidth={2} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.fg.default, fontFamily: fonts.sans.semibold }]}>
                Help
              </Text>
              <View style={styles.placeholder} />
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={[styles.emptyText, { color: colors.fg.muted, fontFamily: fonts.sans.regular }]}>
                Help content coming soon
              </Text>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
  },
});
