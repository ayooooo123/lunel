// Editor Tabs Component with FlatList for reliable scrolling
import React, { memo, useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { X, PlusCircle } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemeColors, radius } from '@/constants/themes';
import { EditorTab, SupportedLanguage, FILE_ICONS } from './types';

interface EditorTabsProps {
  tabs: EditorTab[];
  activeTabId: string;
  colors: ThemeColors;
  onTabPress: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNewTab: () => void;
}

// Get icon for file type
const getFileIcon = (language: SupportedLanguage): string => {
  return FILE_ICONS[language] || 'document';
};


// Spring config for smooth animations
const springConfig = {
  damping: 20,
  stiffness: 200,
  mass: 0.8,
};

// Individual animated tab component
const AnimatedTabItem = memo(({
  tab,
  isActive,
  isLast,
  showDivider,
  targetWidth,
  colors,
  onPress,
  onClose,
  isNew,
}: {
  tab: EditorTab;
  isActive: boolean;
  isLast: boolean;
  showDivider: boolean;
  targetWidth: number;
  colors: ThemeColors;
  onPress: () => void;
  onClose: () => void;
  isNew: boolean;
}) => {
  const width = useSharedValue(isNew ? 0 : targetWidth);
  const opacity = useSharedValue(isNew ? 0 : 1);
  const scale = useSharedValue(1);

  useEffect(() => {
    width.value = withSpring(targetWidth, springConfig);
    opacity.value = withSpring(1, springConfig);
  }, [targetWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
  };

  return (
    <Animated.View style={[animatedStyle, { overflow: 'hidden' }]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[
          styles.tab,
          {
            backgroundColor: isActive ? colors.bg.raised : 'transparent',
            marginRight: isLast ? 0 : 2,
          },
        ]}
      >
        {showDivider && (
          <View style={[styles.divider, { backgroundColor: colors.bg.overlay }]} />
        )}

        <View style={[styles.tabContent, { marginRight: isActive ? 6 : 0 }]}>
          <Ionicons
            name={getFileIcon(tab.language) as any}
            size={16}
            color={isActive ? colors.fg.default : colors.fg.muted}
            style={styles.tabIcon}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.tabText,
              { color: isActive ? colors.fg.default : colors.fg.muted },
            ]}
          >
            {tab.fileName}
          </Text>
          {tab.isModified && (
            <View style={[styles.modifiedDot, { backgroundColor: colors.accent.default }]} />
          )}
        </View>

        {isActive && (
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={14} color={colors.fg.default} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

const EditorTabs: React.FC<EditorTabsProps> = memo(({
  tabs,
  activeTabId,
  colors,
  onTabPress,
  onTabClose,
  onNewTab,
}) => {
  const listRef = useRef<FlatList>(null);
  const [newTabIds, setNewTabIds] = useState<Set<string>>(new Set());
  const prevTabIds = useRef<string[]>(tabs.map(t => t.id));
  const prevTabCount = useRef(tabs.length);
  const scrollOffset = useRef(0);

  // Dynamic tab width based on number of tabs
  const getTabWidth = useCallback((count: number) => {
    if (count <= 0) return 140;
    if (count === 1) return 180;
    if (count === 2) return 160;
    return 140;
  }, []);

  const tabWidth = getTabWidth(tabs.length);

  // Handle tab changes - mark new tabs and scroll
  useEffect(() => {
    const currentIds = tabs.map(t => t.id);
    const addedIds = currentIds.filter(id => !prevTabIds.current.includes(id));
    const wasTabRemoved = tabs.length < prevTabCount.current;

    if (addedIds.length > 0) {
      setNewTabIds(new Set(addedIds));
      // Scroll to end when new tab added
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 50);
      // Clear new status after animation completes
      setTimeout(() => setNewTabIds(new Set()), 300);
    }

    // Adjust scroll when tab removed to fill empty space
    if (wasTabRemoved && tabs.length > 0) {
      const newContentWidth = tabs.length * (tabWidth + 2);
      const maxOffset = Math.max(0, newContentWidth - 200); // 200 is approximate visible width
      if (scrollOffset.current > maxOffset) {
        setTimeout(() => {
          listRef.current?.scrollToOffset({ offset: maxOffset, animated: true });
        }, 50);
      }
    }

    prevTabIds.current = currentIds;
    prevTabCount.current = tabs.length;
  }, [tabs, tabWidth]);

  const handleNewTab = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNewTab();
  };

  const renderTab = useCallback(({ item, index }: { item: EditorTab; index: number }) => {
    const isActive = activeTabId === item.id;
    const isLast = index === tabs.length - 1;
    const nextTabIsActive = index < tabs.length - 1 && tabs[index + 1].id === activeTabId;
    const showDivider = !isLast && !isActive && !nextTabIsActive;
    const isNew = newTabIds.has(item.id);

    return (
      <AnimatedTabItem
        tab={item}
        isActive={isActive}
        isLast={isLast}
        showDivider={showDivider}
        targetWidth={tabWidth}
        colors={colors}
        onPress={() => onTabPress(item.id)}
        onClose={() => onTabClose(item.id)}
        isNew={isNew}
      />
    );
  }, [activeTabId, tabs, tabWidth, colors, newTabIds, onTabPress, onTabClose]);

  // Empty state - just show text, the full empty state is shown in editor area
  if (tabs.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg.base }]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.fg.muted }]}>
            No files open
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleNewTab}
          style={styles.newTabButton}
          activeOpacity={0.7}
        >
          <PlusCircle size={22} color={colors.fg.muted} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.base }]}>
      <FlatList
        ref={listRef}
        data={tabs}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyExtractor={(item) => item.id}
        renderItem={renderTab}
        getItemLayout={(_, index) => ({
          length: tabWidth + 2,
          offset: (tabWidth + 2) * index,
          index,
        })}
        onScroll={(e) => {
          scrollOffset.current = e.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
      />

      <TouchableOpacity
        onPress={handleNewTab}
        style={styles.newTabButton}
        activeOpacity={0.7}
      >
        <Ionicons name="add-outline" size={22} color={colors.fg.muted} />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 50,
    flexDirection: 'row',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
  scrollContent: {
    paddingLeft: 8,
    paddingRight: 8,
    alignItems: 'flex-end',
  },
  tab: {
    height: 44,
    borderRadius: radius.md,
    marginBottom: 3,
    paddingLeft: 10,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    position: 'absolute',
    right: -2,
    width: 1,
    height: 18,
    top: 13,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 13,
    flex: 1,
  },
  modifiedDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    marginLeft: 4,
  },
  closeButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newTabButton: {
    width: 44,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default EditorTabs;
