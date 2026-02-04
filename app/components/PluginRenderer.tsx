import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlugins } from '@/plugins';
import { PluginPanelProps } from '@/plugins/types';

const BOTTOM_BAR_COLLAPSED_HEIGHT = 82;

// Memoized panel wrapper - only re-renders when isActive changes
const MemoizedPanel = memo(function MemoizedPanel({
  component: PanelComponent,
  instanceId,
  isActive,
}: {
  component: React.ComponentType<PluginPanelProps>;
  instanceId: string;
  isActive: boolean;
}) {
  return (
    <View
      style={[
        styles.panel,
        // Use display none for inactive - RN will skip layout/rendering
        // pointerEvents none prevents touch events on hidden views
        {
          display: isActive ? 'flex' : 'none',
          pointerEvents: isActive ? 'auto' : 'none',
        },
      ]}
    >
      <PanelComponent instanceId={instanceId} isActive={isActive} />
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if isActive changes
  // or if it's active and instanceId changed (shouldn't happen)
  if (prevProps.isActive !== nextProps.isActive) return false;
  if (prevProps.instanceId !== nextProps.instanceId) return false;
  // Don't re-render inactive panels at all
  if (!nextProps.isActive) return true;
  return true;
});

export default function PluginRenderer({ paddingBottom = BOTTOM_BAR_COLLAPSED_HEIGHT }: { paddingBottom?: number }) {
  const { colors } = useTheme();
  const { openTabs, activeTabId, getPlugin } = usePlugins();

  // Memoize the tabs to render - only changes when openTabs changes
  const tabsToRender = useMemo(() => {
    return openTabs.map((tab) => {
      const plugin = getPlugin(tab.pluginId);
      if (!plugin) return null;
      return {
        id: tab.id,
        pluginId: tab.pluginId,
        component: plugin.component,
      };
    }).filter(Boolean);
  }, [openTabs, getPlugin]);

  // Get the active tab for empty state check
  const activeTab = openTabs.find(t => t.id === activeTabId);

  if (!activeTab) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg.base, paddingBottom }]}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.fg.muted }]}>No active tab</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom }]}>
      {tabsToRender.map((tab) => {
        if (!tab) return null;
        const isActive = tab.id === activeTabId;

        return (
          <MemoizedPanel
            key={tab.id}
            component={tab.component}
            instanceId={tab.id}
            isActive={isActive}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  panel: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
