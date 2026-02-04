import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Animated,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
  CloudOff,
  Menu,
  X,
  Search,
  Settings2,
  ArrowLeft,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  RefreshCw,
  AlertCircle,
  Pencil,
  Trash,
} from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import { useConnection } from '@/contexts/ConnectionContext';
import { useApi, FileEntry, ApiError } from '@/hooks/useApi';
import { usePlugins } from '@/plugins/context';
import { editorStore } from '@/components/editor/EditorStore';
import { LANGUAGE_EXTENSIONS, SupportedLanguage } from '@/components/editor/types';
import { PluginPanelProps } from '../../types';

type SortOption = 'name' | 'size' | 'modified';
type FilterOption = 'all' | 'files' | 'folders';

// Helper functions (moved outside component to avoid re-creation)
const formatFileSize = (bytes?: number) => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatTime = (mtime?: number) => {
  if (!mtime) return '-';
  const date = new Date(mtime);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const getFileIcon = (name: string): string => {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'logo-react';
    case 'js':
    case 'jsx':
      return 'logo-javascript';
    case 'json':
      return 'code-slash';
    case 'md':
      return 'document-text';
    case 'css':
    case 'scss':
      return 'color-palette';
    default:
      return 'document-outline';
  }
};

// Memoized file item component
interface FileItemProps {
  item: FileEntry;
  isFirst: boolean;
  onPress: (item: FileEntry) => void;
  colors: any;
  fonts: any;
  spacing: any;
  radius: any;
}

const FileItem = memo(function FileItem({ item, isFirst, onPress, colors, fonts, spacing, radius }: FileItemProps) {
  return (
    <>
      {!isFirst && (
        <View style={{ height: 1, backgroundColor: colors.bg.overlay, marginLeft: 56 }} />
      )}
      <TouchableOpacity
        onPress={() => onPress(item)}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: spacing[3],
          gap: spacing[3],
        }}
      >
        <View style={{
          width: 40,
          height: 40,
          borderRadius: radius.md,
          backgroundColor: item.type === 'directory' ? colors.accent.subtle : colors.bg.overlay,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Ionicons
            name={item.type === 'directory' ? 'folder' : getFileIcon(item.name) as any}
            size={20}
            color={item.type === 'directory' ? colors.accent.default : colors.fg.muted}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 15,
            fontFamily: fonts.sans.medium,
            color: colors.fg.default,
          }} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={{
            fontSize: 12,
            fontFamily: fonts.sans.regular,
            color: colors.fg.muted,
            marginTop: 2,
          }}>
            {item.type === 'directory' ? 'Directory' : formatFileSize(item.size)}
            {item.mtime && ` · ${formatTime(item.mtime)}`}
          </Text>
        </View>
        <ChevronRight size={18} color={colors.fg.subtle} />
      </TouchableOpacity>
    </>
  );
});

function ExplorerPanel({ instanceId, isActive }: PluginPanelProps) {
  const { colors, fonts, spacing, radius } = useTheme();
  const navigation = useNavigation();
  const openDrawer = () => navigation.dispatch(DrawerActions.openDrawer());
  const { openTab } = usePlugins();

  const { status, capabilities } = useConnection();
  const { fs } = useApi();
  const isConnected = status === 'connected';

  const [currentPath, setCurrentPath] = useState('.');
  const [items, setItems] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [selectedItem, setSelectedItem] = useState<FileEntry | null>(null);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'file' | 'directory'>('file');
  const [newName, setNewName] = useState('');
  const [backdropAnim] = useState(new Animated.Value(0));
  const [modalAnim] = useState(new Animated.Value(300));

  // Get language from file extension
  const getLanguageFromPath = (filePath: string): SupportedLanguage => {
    const ext = '.' + filePath.split('.').pop()?.toLowerCase();
    return LANGUAGE_EXTENSIONS[ext] || 'plaintext';
  };

  // Open file in editor plugin
  const openInEditor = async (item: FileEntry) => {
    const filePath = currentPath === '.' ? item.name : `${currentPath}/${item.name}`;
    closeModal();

    try {
      const result = await fs.read(filePath);
      if (result.encoding === 'base64') {
        Alert.alert('Binary File', 'Cannot edit binary files');
        return;
      }

      const language = getLanguageFromPath(filePath);
      // Open in editor store (creates tab or switches to existing)
      editorStore.openFile(filePath, item.name, language, result.content);
      // Switch to editor plugin
      openTab('editor');
    } catch (err) {
      const apiError = err as ApiError;
      Alert.alert('Error', apiError.message || 'Failed to read file');
    }
  };

  // Load directory contents
  const loadDirectory = useCallback(async (path: string) => {
    if (!isConnected) return;

    setLoading(true);
    setError(null);
    try {
      const entries = await fs.list(path);
      setItems(entries);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load directory');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isConnected, fs]);

  // Load on mount and when path changes
  useEffect(() => {
    if (isConnected) {
      loadDirectory(currentPath);
    }
  }, [currentPath, isConnected, loadDirectory]);

  // Refresh when panel becomes active
  useEffect(() => {
    if (isActive && isConnected) {
      loadDirectory(currentPath);
    }
  }, [isActive, isConnected]);

  // Get filtered and sorted items
  const currentItems = useMemo(() => {
    let result = [...items];

    // Filter
    if (filterBy === 'files') {
      result = result.filter(item => item.type === 'file');
    } else if (filterBy === 'folders') {
      result = result.filter(item => item.type === 'directory');
    }

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => item.name.toLowerCase().includes(query));
    }

    // Sort
    result.sort((a, b) => {
      // Folders always first
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }

      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'size':
          return (b.size || 0) - (a.size || 0);
        case 'modified':
          return (b.mtime || 0) - (a.mtime || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [items, searchQuery, sortBy, filterBy]);

  // Path segments for breadcrumb
  const pathSegments = useMemo(() => {
    if (currentPath === '.' || currentPath === '') return [{ name: 'Root', path: '.' }];
    const parts = currentPath.split('/').filter(Boolean);
    return [
      { name: 'Root', path: '.' },
      ...parts.map((part, i) => ({
        name: part,
        path: parts.slice(0, i + 1).join('/'),
      })),
    ];
  }, [currentPath]);

  const navigateUp = () => {
    if (currentPath === '.' || currentPath === '') return;
    const segments = currentPath.split('/').filter(Boolean);
    if (segments.length <= 1) {
      setCurrentPath('.');
    } else {
      setCurrentPath(segments.slice(0, -1).join('/'));
    }
  };

  const openItem = (item: FileEntry) => {
    if (item.type === 'directory') {
      const newPath = currentPath === '.' ? item.name : `${currentPath}/${item.name}`;
      setCurrentPath(newPath);
    } else {
      setSelectedItem(item);
      openModal();
    }
  };

  const openModal = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(modalAnim, { toValue: 0, useNativeDriver: true, damping: 25, stiffness: 300 }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(modalAnim, { toValue: 300, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setSelectedItem(null);
    });
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;

    const path = currentPath === '.' ? newName : `${currentPath}/${newName}`;
    try {
      await fs.create(path, createType);
      setShowCreateModal(false);
      setNewName('');
      loadDirectory(currentPath);
    } catch (err) {
      const apiError = err as ApiError;
      Alert.alert('Error', apiError.message || 'Failed to create');
    }
  };

  const handleDelete = async (item: FileEntry) => {
    const path = currentPath === '.' ? item.name : `${currentPath}/${item.name}`;
    Alert.alert(
      'Delete',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await fs.remove(path, true);
              closeModal();
              loadDirectory(currentPath);
            } catch (err) {
              const apiError = err as ApiError;
              Alert.alert('Error', apiError.message || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'name': return 'Name';
      case 'size': return 'Size';
      case 'modified': return 'Modified';
    }
  };

  const getFilterLabel = (option: FilterOption) => {
    switch (option) {
      case 'all': return 'All';
      case 'files': return 'Files only';
      case 'folders': return 'Folders only';
    }
  };

  const hasActiveFilters = sortBy !== 'name' || filterBy !== 'all';

  // Not connected state
  if (!isConnected) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg.base, justifyContent: 'center', alignItems: 'center' }}>
        <CloudOff size={48} color={colors.fg.muted} />
        <Text style={{ color: colors.fg.muted, fontSize: 16, marginTop: spacing[3] }}>
          Not connected to CLI
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.base }}>
      {/* Header - 56px */}
      <View style={{
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[2],
      }}>
        <TouchableOpacity
          onPress={openDrawer}
          style={{ padding: spacing[2] }}
        >
          <Menu size={22} color={colors.fg.default} />
        </TouchableOpacity>
        <Text style={{
          flex: 1,
          fontSize: 17,
          fontFamily: fonts.sans.semibold,
          color: colors.fg.default,
          marginLeft: spacing[2],
        }}>
          Explorer
        </Text>
        <TouchableOpacity
          onPress={() => setShowSearch(!showSearch)}
          style={{ padding: spacing[2] }}
        >
          {showSearch ? (
            <X size={20} color={colors.fg.muted} />
          ) : (
            <Search size={20} color={colors.fg.muted} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowFiltersModal(true)}
          style={{ padding: spacing[2] }}
        >
          <View>
            <Settings2 size={20} color={colors.fg.muted} />
            {hasActiveFilters && (
              <View style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 8,
                height: 8,
                borderRadius: radius.full,
                backgroundColor: colors.accent.default,
              }} />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Search Bar (hidden by default) */}
      {showSearch && (
        <View style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[3] }}>
          <TextInput
            style={{
              paddingHorizontal: spacing[4],
              paddingVertical: spacing[3],
              borderRadius: radius.md,
              fontSize: 14,
              fontFamily: fonts.sans.regular,
              color: colors.fg.default,
              backgroundColor: colors.bg.raised,
            }}
            placeholder="Search in this folder..."
            placeholderTextColor={colors.fg.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      )}

      {/* Path Bar */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[4],
        paddingBottom: spacing[2],
        gap: spacing[2],
      }}>
        <TouchableOpacity
          onPress={navigateUp}
          disabled={currentPath === '.' || currentPath === ''}
          style={{
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radius.md,
            backgroundColor: currentPath === '.' ? colors.bg.raised : colors.bg.overlay,
            opacity: currentPath === '.' ? 0.5 : 1,
          }}
        >
          <ArrowLeft size={18} color={colors.fg.default} />
        </TouchableOpacity>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ alignItems: 'center', gap: spacing[1] }}
        >
          {pathSegments.map((segment, index) => (
            <React.Fragment key={segment.path}>
              {index > 0 && (
                <ChevronRight size={14} color={colors.fg.subtle} />
              )}
              <TouchableOpacity
                onPress={() => setCurrentPath(segment.path)}
                style={{
                  paddingHorizontal: spacing[2],
                  paddingVertical: spacing[1],
                  borderRadius: radius.sm,
                  backgroundColor: index === pathSegments.length - 1 ? colors.accent.subtle : 'transparent',
                }}
              >
                <Text style={{
                  fontSize: 13,
                  fontFamily: fonts.sans.medium,
                  color: index === pathSegments.length - 1 ? colors.accent.default : colors.fg.muted,
                }}>
                  {segment.name}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </ScrollView>
      </View>

      {/* Action Buttons */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[4],
        paddingBottom: spacing[3],
      }}>
        <TouchableOpacity
          onPress={() => {
            setCreateType('file');
            setNewName('');
            setShowCreateModal(true);
          }}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing[1],
            paddingVertical: spacing[2],
            borderRadius: radius.md,
          }}
        >
          <FileText size={16} color={colors.fg.muted} />
          <Text style={{ fontSize: 13, fontFamily: fonts.sans.medium, color: colors.fg.muted }}>
            New File
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setCreateType('directory');
            setNewName('');
            setShowCreateModal(true);
          }}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing[1],
            paddingVertical: spacing[2],
            borderRadius: radius.md,
          }}
        >
          <Folder size={16} color={colors.fg.muted} />
          <Text style={{ fontSize: 13, fontFamily: fonts.sans.medium, color: colors.fg.muted }}>
            New Folder
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => loadDirectory(currentPath)}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing[1],
            paddingVertical: spacing[2],
            borderRadius: radius.md,
          }}
        >
          <RefreshCw size={16} color={colors.fg.muted} />
          <Text style={{ fontSize: 13, fontFamily: fonts.sans.medium, color: colors.fg.muted }}>
            Refresh
          </Text>
        </TouchableOpacity>
      </View>

      {/* File List */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent.default} />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[4] }}>
          <AlertCircle size={48} color={colors.status.error} />
          <Text style={{
            fontSize: 14,
            fontFamily: fonts.sans.medium,
            color: colors.status.error,
            marginTop: spacing[3],
            textAlign: 'center',
          }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => loadDirectory(currentPath)}
            style={{
              marginTop: spacing[3],
              paddingHorizontal: spacing[4],
              paddingVertical: spacing[2],
              borderRadius: radius.md,
              backgroundColor: colors.bg.raised,
            }}
          >
            <Text style={{ fontSize: 14, fontFamily: fonts.sans.medium, color: colors.fg.default }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : currentItems.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <FolderOpen size={48} color={colors.fg.subtle} />
          <Text style={{
            fontSize: 14,
            fontFamily: fonts.sans.medium,
            color: colors.fg.muted,
            marginTop: spacing[3],
          }}>
            {searchQuery ? 'No matching items' : 'This folder is empty'}
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: spacing[4] }}>
          <View style={{
            backgroundColor: colors.bg.raised,
            borderRadius: radius.lg,
            overflow: 'hidden',
            flex: 1,
          }}>
            <FlashList
              data={currentItems}
              renderItem={({ item, index }) => (
                <FileItem
                  item={item}
                  isFirst={index === 0}
                  onPress={openItem}
                  colors={colors}
                  fonts={fonts}
                  spacing={spacing}
                  radius={radius}
                />
              )}
              keyExtractor={(item) => item.name}
            />
          </View>
        </View>
      )}

      {/* File Detail Modal */}
      <Modal
        visible={selectedItem !== null}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <View style={{ flex: 1 }}>
          <Animated.View
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              opacity: backdropAnim,
            }}
          >
            <Pressable style={{ flex: 1 }} onPress={closeModal} />
          </Animated.View>

          <Animated.View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: colors.bg.raised,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              maxHeight: '60%',
              transform: [{ translateY: modalAnim }],
            }}
          >
            {/* Modal Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: spacing[4],
              borderBottomWidth: 1,
              borderBottomColor: colors.bg.overlay,
              gap: spacing[3],
            }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: radius.lg,
                backgroundColor: colors.bg.overlay,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons
                  name={getFileIcon(selectedItem?.name || '') as any}
                  size={24}
                  color={colors.fg.muted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  fontFamily: fonts.sans.semibold,
                  color: colors.fg.default,
                }} numberOfLines={1}>
                  {selectedItem?.name}
                </Text>
                <Text style={{
                  fontSize: 13,
                  fontFamily: fonts.mono.regular,
                  color: colors.fg.muted,
                  marginTop: 2,
                }} numberOfLines={1}>
                  {currentPath === '.' ? selectedItem?.name : `${currentPath}/${selectedItem?.name}`}
                </Text>
              </View>
              <TouchableOpacity onPress={closeModal} style={{ padding: spacing[1] }}>
                <X size={24} color={colors.fg.muted} />
              </TouchableOpacity>
            </View>

            {/* File Info */}
            <ScrollView style={{ padding: spacing[4] }}>
              <View style={{ gap: spacing[4] }}>
                <View style={{ flexDirection: 'row', gap: spacing[4] }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontFamily: fonts.sans.medium, color: colors.fg.subtle, marginBottom: 4 }}>
                      Size
                    </Text>
                    <Text style={{ fontSize: 15, fontFamily: fonts.sans.regular, color: colors.fg.default }}>
                      {formatFileSize(selectedItem?.size)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontFamily: fonts.sans.medium, color: colors.fg.subtle, marginBottom: 4 }}>
                      Modified
                    </Text>
                    <Text style={{ fontSize: 15, fontFamily: fonts.sans.regular, color: colors.fg.default }}>
                      {formatTime(selectedItem?.mtime)}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={{ gap: spacing[2], marginTop: spacing[2] }}>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing[3],
                      padding: spacing[3],
                      borderRadius: radius.md,
                      backgroundColor: colors.accent.default,
                    }}
                    onPress={() => selectedItem && openInEditor(selectedItem)}
                  >
                    <Ionicons name="open-outline" size={20} color={colors.accent.fg} />
                    <Text style={{ fontSize: 15, fontFamily: fonts.sans.medium, color: colors.accent.fg }}>
                      Open in Editor
                    </Text>
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: spacing[2],
                        padding: spacing[3],
                        borderRadius: radius.md,
                        backgroundColor: colors.bg.overlay,
                      }}
                      onPress={() => {
                        // TODO: Implement rename
                        console.log('Rename');
                      }}
                    >
                      <Pencil size={18} color={colors.fg.default} />
                      <Text style={{ fontSize: 14, fontFamily: fonts.sans.medium, color: colors.fg.default }}>
                        Rename
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: spacing[2],
                        padding: spacing[3],
                        borderRadius: radius.md,
                        backgroundColor: colors.status.error + '15',
                      }}
                      onPress={() => selectedItem && handleDelete(selectedItem)}
                    >
                      <Trash size={18} color={colors.status.error} />
                      <Text style={{ fontSize: 14, fontFamily: fonts.sans.medium, color: colors.status.error }}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setShowCreateModal(false)}
        >
          <View style={{
            backgroundColor: colors.bg.raised,
            borderRadius: radius.lg,
            width: '85%',
            maxWidth: 320,
            padding: spacing[4],
          }}>
            <Text style={{
              fontSize: 17,
              fontFamily: fonts.sans.semibold,
              color: colors.fg.default,
              marginBottom: spacing[4],
            }}>
              New {createType === 'file' ? 'File' : 'Folder'}
            </Text>
            <TextInput
              style={{
                paddingHorizontal: spacing[4],
                paddingVertical: spacing[3],
                borderRadius: radius.md,
                fontSize: 14,
                fontFamily: fonts.sans.regular,
                color: colors.fg.default,
                backgroundColor: colors.bg.base,
                marginBottom: spacing[4],
              }}
              placeholder={createType === 'file' ? 'filename.txt' : 'folder-name'}
              placeholderTextColor={colors.fg.muted}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: spacing[2] }}>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: spacing[3],
                  borderRadius: radius.md,
                  backgroundColor: colors.bg.overlay,
                }}
              >
                <Text style={{ fontSize: 14, fontFamily: fonts.sans.medium, color: colors.fg.default }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreate}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: spacing[3],
                  borderRadius: radius.md,
                  backgroundColor: colors.accent.default,
                }}
              >
                <Text style={{ fontSize: 14, fontFamily: fonts.sans.medium, color: colors.accent.fg }}>
                  Create
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Filters Modal */}
      <Modal
        visible={showFiltersModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFiltersModal(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setShowFiltersModal(false)}
        >
          <View style={{
            backgroundColor: colors.bg.raised,
            borderRadius: radius.lg,
            width: '85%',
            maxWidth: 320,
            overflow: 'hidden',
          }}>
            {/* Modal Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: spacing[4],
              borderBottomWidth: 1,
              borderBottomColor: colors.bg.overlay,
            }}>
              <Text style={{
                fontSize: 17,
                fontFamily: fonts.sans.semibold,
                color: colors.fg.default,
              }}>
                Sort & Filter
              </Text>
              <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
                <X size={24} color={colors.fg.muted} />
              </TouchableOpacity>
            </View>

            {/* Sort Options */}
            <View style={{ padding: spacing[4] }}>
              <Text style={{
                fontSize: 12,
                fontFamily: fonts.sans.semibold,
                color: colors.fg.muted,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: spacing[3],
              }}>
                Sort by
              </Text>
              <View style={{ gap: spacing[2] }}>
                {(['name', 'size', 'modified'] as SortOption[]).map(option => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => setSortBy(option)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing[3],
                      paddingVertical: spacing[3],
                      paddingHorizontal: spacing[3],
                      borderRadius: radius.md,
                      backgroundColor: sortBy === option ? colors.accent.subtle : 'transparent',
                    }}
                  >
                    <Ionicons
                      name={sortBy === option ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={sortBy === option ? colors.accent.default : colors.fg.muted}
                    />
                    <Text style={{
                      fontSize: 15,
                      fontFamily: fonts.sans.regular,
                      color: sortBy === option ? colors.accent.default : colors.fg.default,
                    }}>
                      {getSortLabel(option)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Filter Options */}
            <View style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[4] }}>
              <Text style={{
                fontSize: 12,
                fontFamily: fonts.sans.semibold,
                color: colors.fg.muted,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: spacing[3],
              }}>
                Show
              </Text>
              <View style={{ gap: spacing[2] }}>
                {(['all', 'files', 'folders'] as FilterOption[]).map(option => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => setFilterBy(option)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing[3],
                      paddingVertical: spacing[3],
                      paddingHorizontal: spacing[3],
                      borderRadius: radius.md,
                      backgroundColor: filterBy === option ? colors.accent.subtle : 'transparent',
                    }}
                  >
                    <Ionicons
                      name={filterBy === option ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={filterBy === option ? colors.accent.default : colors.fg.muted}
                    />
                    <Text style={{
                      fontSize: 15,
                      fontFamily: fonts.sans.regular,
                      color: filterBy === option ? colors.accent.default : colors.fg.default,
                    }}>
                      {getFilterLabel(option)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Reset Button */}
            {hasActiveFilters && (
              <View style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[4] }}>
                <TouchableOpacity
                  onPress={() => {
                    setSortBy('name');
                    setFilterBy('all');
                  }}
                  style={{
                    alignItems: 'center',
                    paddingVertical: spacing[3],
                    borderRadius: radius.md,
                    backgroundColor: colors.bg.overlay,
                  }}
                >
                  <Text style={{
                    fontSize: 14,
                    fontFamily: fonts.sans.medium,
                    color: colors.fg.default,
                  }}>
                    Reset to Default
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export default memo(ExplorerPanel);
