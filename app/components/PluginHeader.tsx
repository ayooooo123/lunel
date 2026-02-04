import { ThemeColors } from "@/constants/themes";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { Menu, Plus } from "lucide-react-native";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Base tab interface - extend this for specific tab types
export interface BaseTab {
  id: string;
  title: string;
}

interface PluginHeaderProps<T extends BaseTab> {
  // Optional title for simple headers (without tabs)
  title?: string;

  // Tab-based headers
  tabs?: T[];
  activeTabId?: string;
  onTabPress?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  onNewTab?: () => void;

  // Custom tab renderer for specialized tab displays
  renderTab?: (
    tab: T,
    isActive: boolean,
    isLast: boolean,
    showDivider: boolean,
    targetWidth: number,
    onPress: () => void,
    onClose: () => void,
    isNew: boolean
  ) => React.ReactElement | null;

  // Theme colors
  colors: ThemeColors;

  // Optional: Custom width calculator based on tab count
  getTabWidth?: (count: number) => number;
}

const defaultGetTabWidth = (count: number): number => {
  if (count <= 0) return 120;
  if (count === 1) return 160;
  if (count === 2) return 140;
  return 120;
};

function PluginHeader<T extends BaseTab>({
  title,
  tabs,
  activeTabId,
  onTabPress,
  onTabClose,
  onNewTab,
  renderTab,
  colors,
  getTabWidth = defaultGetTabWidth,
}: PluginHeaderProps<T>) {
  const navigation = useNavigation();
  const openDrawer = () => navigation.dispatch(DrawerActions.openDrawer());

  const tabsListRef = useRef<FlatList>(null);
  const prevTabIds = useRef<string[]>(tabs?.map((t) => t.id) || []);
  const prevTabCount = useRef(tabs?.length || 0);
  const scrollOffset = useRef(0);
  const [newTabIds, setNewTabIds] = useState<Set<string>>(new Set());

  const tabWidth = getTabWidth(tabs?.length || 0);

  // Handle tab changes - mark new tabs and scroll
  useEffect(() => {
    if (!tabs) return;

    const currentIds = tabs.map((t) => t.id);
    const addedIds = currentIds.filter(
      (id) => !prevTabIds.current.includes(id)
    );
    const wasTabRemoved = tabs.length < prevTabCount.current;

    if (addedIds.length > 0) {
      setNewTabIds(new Set(addedIds));
      setTimeout(() => {
        tabsListRef.current?.scrollToEnd({ animated: true });
      }, 50);
      setTimeout(() => setNewTabIds(new Set()), 300);
    }

    if (wasTabRemoved && tabs.length > 0) {
      const newContentWidth = tabs.length * (tabWidth + 2);
      const maxOffset = Math.max(0, newContentWidth - 200);
      if (scrollOffset.current > maxOffset) {
        setTimeout(() => {
          tabsListRef.current?.scrollToOffset({
            offset: maxOffset,
            animated: true,
          });
        }, 50);
      }
    }

    prevTabIds.current = currentIds;
    prevTabCount.current = tabs.length;
  }, [tabs, tabWidth]);

  const renderTabItem = useCallback(
    ({ item, index }: { item: T; index: number }): React.ReactElement | null => {
      if (!renderTab || !tabs || !activeTabId) return null;

      const isActive = activeTabId === item.id;
      const isLast = index === tabs.length - 1;
      const nextTabIsActive =
        index < tabs.length - 1 && tabs[index + 1].id === activeTabId;
      const showDivider = !isLast && !isActive && !nextTabIsActive;
      const isNew = newTabIds.has(item.id);

      return renderTab(
        item,
        isActive,
        isLast,
        showDivider,
        tabWidth,
        () => onTabPress?.(item.id),
        () => onTabClose?.(item.id),
        isNew
      );
    },
    [renderTab, tabs, activeTabId, tabWidth, newTabIds, onTabPress, onTabClose]
  );

  // Simple header (no tabs)
  if (!tabs || tabs.length === 0) {
    return (
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: colors.bg.raised,
            borderBottomColor: colors.bg.overlay,
          },
        ]}
      >
        <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
          <Menu size={22} color={colors.fg.default} strokeWidth={2} />
        </TouchableOpacity>
        {title && (
          <Text style={[styles.title, { color: colors.fg.default }]}>
            {title}
          </Text>
        )}
      </View>
    );
  }

  // Tab-based header
  return (
    <View
      style={[
        styles.headerBar,
        {
          backgroundColor: colors.bg.raised,
          borderBottomColor: colors.bg.overlay,
        },
      ]}
    >
      <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
        <Menu size={22} color={colors.fg.default} strokeWidth={2} />
      </TouchableOpacity>

      <View style={styles.tabsContainer}>
        <FlatList
          ref={tabsListRef}
          data={tabs}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyExtractor={(item) => item.id}
          renderItem={renderTabItem}
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

        {onNewTab && (
          <TouchableOpacity
            onPress={onNewTab}
            style={styles.newTabButton}
            activeOpacity={0.7}
          >
            <Plus size={22} color={colors.fg.muted} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderBottomWidth: 1,
    paddingHorizontal: 4,
  },
  menuButton: {
    paddingHorizontal: 8,
    height: 60,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  tabsContainer: {
    flex: 1,
    flexDirection: "row",
    height: 60,
  },
  scrollContent: {
    paddingLeft: 4,
    paddingRight: 8,
    alignItems: "flex-end",
  },
  newTabButton: {
    width: 44,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default memo(PluginHeader) as typeof PluginHeader;
