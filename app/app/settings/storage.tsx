import { useTheme } from "@/contexts/ThemeContext";
import { lunelApi, StorageFileInfo } from "@/lib/storage";
import { ChevronLeft, ChevronRight, RefreshCw, AlertTriangle, FolderOpen, FileText, X, Trash } from "lucide-react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function StorageExplorerPage() {
  const { colors, fonts, radius, spacing, isDark } = useTheme();
  const router = useRouter();

  const [files, setFiles] = useState<StorageFileInfo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");

  // Modal animations
  const [modalVisible, setModalVisible] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (selectedFile) {
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
  }, [selectedFile]);

  const loadFiles = useCallback(async () => {
    const list = await lunelApi.storage.jsons.list();
    setFiles(list);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFiles();
    setRefreshing(false);
  }, [loadFiles]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const openFile = async (name: string) => {
    const data = await lunelApi.storage.jsons.read(name.replace('.json', ''));
    setFileContent(JSON.stringify(data, null, 2));
    setSelectedFile(name);
  };

  const closeModal = () => {
    setSelectedFile(null);
    setFileContent("");
  };

  const deleteFile = async () => {
    if (!selectedFile) return;
    await lunelApi.storage.jsons.delete(selectedFile.replace('.json', ''));
    closeModal();
    loadFiles();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

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
          Storage Explorer
        </Text>
        <TouchableOpacity onPress={onRefresh} style={[styles.backButton, { borderRadius: radius.md }]}>
          <RefreshCw size={20} color={colors.fg.muted} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Warning */}
      <View style={{
        marginHorizontal: spacing[4],
        marginBottom: spacing[3],
        padding: spacing[3],
        backgroundColor: colors.status.warning + '15',
        borderRadius: radius.md,
        flexDirection: 'row',
        gap: spacing[3],
      }}>
        <AlertTriangle size={18} color={colors.status.warning} style={{ marginTop: 2 }} strokeWidth={2} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontFamily: fonts.sans.medium, color: colors.status.warning, marginBottom: 4 }}>
            Internal App Data
          </Text>
          <Text style={{ fontSize: 11, fontFamily: fonts.sans.regular, color: colors.fg.muted, lineHeight: 16 }}>
            Modifying or deleting files here can cause data loss or break things. Proceed only if you know what you're doing.
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {files.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: spacing[8] }}>
            <FolderOpen size={48} color={colors.fg.subtle} strokeWidth={1.5} />
            <Text style={{
              fontSize: 14,
              fontFamily: fonts.sans.medium,
              color: colors.fg.muted,
              marginTop: spacing[3],
            }}>
              No storage files yet
            </Text>
          </View>
        ) : (
          <View style={[styles.section, { backgroundColor: colors.bg.raised, borderRadius: radius.lg, marginHorizontal: spacing[4] }]}>
            {files.map((file, index) => (
              <React.Fragment key={file.name}>
                {index > 0 && (
                  <View style={[styles.divider, { backgroundColor: colors.bg.overlay }]} />
                )}
                <TouchableOpacity
                  style={[styles.fileRow, { paddingVertical: spacing[3], paddingHorizontal: spacing[4] }]}
                  onPress={() => openFile(file.name)}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.accent.subtle, borderRadius: radius.md }]}>
                      <FileText size={18} color={colors.accent.default} strokeWidth={2} />
                    </View>
                    <View>
                      <Text style={{ fontSize: 15, fontFamily: fonts.mono.regular, color: colors.fg.default }}>
                        {file.name}
                      </Text>
                      <Text style={{ fontSize: 12, fontFamily: fonts.sans.regular, color: colors.fg.muted, marginTop: 2 }}>
                        {formatFileSize(file.size)}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color={colors.fg.subtle} strokeWidth={2} />
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        )}

        <View style={{ height: spacing[8] }} />
      </ScrollView>

      {/* File Viewer Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
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
          <Animated.View style={[styles.modalContainer, { backgroundColor: colors.bg.base, transform: [{ translateY: slideAnim }] }]}>
            {/* Modal Header */}
            <View style={[styles.header, { backgroundColor: colors.bg.base, borderBottomWidth: 1, borderBottomColor: colors.bg.overlay }]}>
              <TouchableOpacity
                onPress={closeModal}
                style={[styles.backButton, { borderRadius: radius.md }]}
              >
                <X size={24} color={colors.fg.default} strokeWidth={2} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.fg.default, fontFamily: fonts.mono.regular, fontSize: 14 }]} numberOfLines={1}>
                {selectedFile}
              </Text>
              <TouchableOpacity
                onPress={deleteFile}
                style={[styles.backButton, { borderRadius: radius.md }]}
              >
                <Trash size={20} color={colors.status.error} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={{ flex: 1 }}
              horizontal
              showsHorizontalScrollIndicator
            >
              <ScrollView showsVerticalScrollIndicator>
                <Text
                  style={{
                    padding: spacing[4],
                    fontSize: 13,
                    fontFamily: fonts.mono.regular,
                    color: colors.fg.default,
                    lineHeight: 20,
                  }}
                  selectable
                >
                  {fileContent}
                </Text>
              </ScrollView>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
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
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    overflow: "hidden",
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    marginLeft: 56,
  },
  modalContainer: {
    flex: 1,
  },
});
