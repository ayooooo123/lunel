import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import {
  Menu,
  RefreshCw,
  AlertTriangle,
  X,
  CloudOff,
  ChevronDown,
  ChevronRight,
} from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import { PluginPanelProps } from '../../types';
import { useApi, SystemInfo, ApiError } from '@/hooks/useApi';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getUsageColor(percent: number, colors: any): string {
  if (percent < 50) return colors.status.success;
  if (percent < 80) return colors.status.warning;
  return colors.status.error;
}

function getRelativeTime(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return date.toLocaleTimeString();
}

const AUTO_REFRESH_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
  { label: '30s', value: 30000 },
];

function MonitorPanel({ instanceId, isActive }: PluginPanelProps) {
  const { colors, fonts, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const openDrawer = () => navigation.dispatch(DrawerActions.openDrawer());
  const { monitor: monitorApi, isConnected } = useApi();

  const coreColumns = width < 350 ? 2 : width < 500 ? 4 : 8;

  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(0);
  const [showAutoRefreshPicker, setShowAutoRefreshPicker] = useState(false);

  // Collapsible sections
  const [cpuExpanded, setCpuExpanded] = useState(true);
  const [memoryExpanded, setMemoryExpanded] = useState(true);
  const [storageExpanded, setStorageExpanded] = useState(true);

  const loadSystemInfo = useCallback(async () => {
    if (!isConnected) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const result = await monitorApi.system();
      setSystemInfo(result);
      setLastUpdated(new Date());
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load system info';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isConnected, monitorApi]);

  // Load on mount and when active
  useEffect(() => {
    if (isActive && isConnected) {
      loadSystemInfo();
    }
  }, [isActive, isConnected, loadSystemInfo]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh === 0 || !isActive || !isConnected) return;
    const interval = setInterval(loadSystemInfo, autoRefresh);
    return () => clearInterval(interval);
  }, [autoRefresh, isActive, isConnected, loadSystemInfo]);

  // Tick for "updated X ago" text
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSystemInfo();
    setRefreshing(false);
  }, [loadSystemInfo]);

  const ProgressBar = ({ percent, color, height = 6 }: { percent: number; color: string; height?: number }) => (
    <View style={{
      height,
      backgroundColor: colors.bg.base,
      borderRadius: radius.full,
      overflow: 'hidden',
    }}>
      <View style={{
        height: '100%',
        width: `${Math.min(percent, 100)}%`,
        backgroundColor: color,
        borderRadius: radius.full,
      }} />
    </View>
  );

  const Section = ({
    title,
    icon,
    expanded,
    onToggle,
    rightContent,
    children,
  }: {
    title: string;
    icon: string;
    expanded: boolean;
    onToggle: () => void;
    rightContent?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <View style={{ marginBottom: spacing[3] }}>
      <TouchableOpacity
        onPress={onToggle}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: spacing[3],
          paddingHorizontal: spacing[4],
          backgroundColor: colors.bg.raised,
          borderRadius: expanded ? undefined : radius.md,
          borderTopLeftRadius: radius.md,
          borderTopRightRadius: radius.md,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
          {expanded ? (
            <ChevronDown size={16} color={colors.fg.muted} />
          ) : (
            <ChevronRight size={16} color={colors.fg.muted} />
          )}
          <Ionicons name={icon as any} size={16} color={colors.fg.muted} />
          <Text style={{
            fontSize: 12,
            fontFamily: fonts.sans.semibold,
            color: colors.fg.muted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
            {title}
          </Text>
        </View>
        {rightContent}
      </TouchableOpacity>
      {expanded && (
        <View style={{
          backgroundColor: colors.bg.raised,
          borderBottomLeftRadius: radius.md,
          borderBottomRightRadius: radius.md,
          paddingHorizontal: spacing[4],
          paddingBottom: spacing[4],
        }}>
          {children}
        </View>
      )}
    </View>
  );

  // Not connected view
  if (!isConnected) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg.base }}>
        <View style={{
          height: 56,
          flexDirection: 'row',
          alignItems: 'center',
          paddingRight: spacing[2],
        }}>
          <TouchableOpacity
            onPress={openDrawer}
            style={{ paddingHorizontal: spacing[4], height: 56, justifyContent: 'center' }}
          >
            <Menu size={22} color={colors.fg.default} />
          </TouchableOpacity>
          <Text style={{
            flex: 1,
            fontSize: 17,
            fontFamily: fonts.sans.semibold,
            color: colors.fg.default,
          }}>
            Monitor
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[6] }}>
          <CloudOff size={48} color={colors.fg.subtle} />
          <Text style={{
            fontSize: 16,
            fontFamily: fonts.sans.medium,
            color: colors.fg.muted,
            marginTop: spacing[4],
            textAlign: 'center',
          }}>
            Not connected to CLI
          </Text>
          <Text style={{
            fontSize: 13,
            fontFamily: fonts.sans.regular,
            color: colors.fg.subtle,
            marginTop: spacing[2],
            textAlign: 'center',
          }}>
            Connect to view system stats
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.base }}>
      {/* Header */}
      <View style={{
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: spacing[2],
      }}>
        <TouchableOpacity
          onPress={openDrawer}
          style={{ paddingHorizontal: spacing[4], height: 56, justifyContent: 'center' }}
        >
          <Menu size={22} color={colors.fg.default} />
        </TouchableOpacity>
        <Text style={{
          flex: 1,
          fontSize: 17,
          fontFamily: fonts.sans.semibold,
          color: colors.fg.default,
        }}>
          Monitor
        </Text>

        <TouchableOpacity
          onPress={() => setShowAutoRefreshPicker(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing[1],
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[2],
            borderRadius: radius.full,
            backgroundColor: autoRefresh > 0 ? colors.accent.default + '20' : 'transparent',
          }}
        >
          <Ionicons
            name="sync"
            size={16}
            color={autoRefresh > 0 ? colors.accent.default : colors.fg.muted}
          />
          <Text style={{
            fontSize: 12,
            fontFamily: fonts.sans.medium,
            color: autoRefresh > 0 ? colors.accent.default : colors.fg.muted,
          }}>
            {AUTO_REFRESH_OPTIONS.find(o => o.value === autoRefresh)?.label}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setLoading(true); loadSystemInfo(); }} style={{ padding: spacing[3] }}>
          <RefreshCw size={20} color={colors.fg.muted} />
        </TouchableOpacity>
      </View>

      {/* Auto-refresh picker modal */}
      <Modal
        visible={showAutoRefreshPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAutoRefreshPicker(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setShowAutoRefreshPicker(false)}
        >
          <View style={{
            backgroundColor: colors.bg.elevated,
            borderRadius: radius.lg,
            padding: spacing[2],
            minWidth: 150,
          }}>
            {AUTO_REFRESH_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => {
                  setAutoRefresh(option.value);
                  setShowAutoRefreshPicker(false);
                }}
                style={{
                  paddingHorizontal: spacing[4],
                  paddingVertical: spacing[3],
                  borderRadius: radius.md,
                  backgroundColor: autoRefresh === option.value ? colors.bg.overlay : 'transparent',
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontFamily: fonts.sans.medium,
                  color: autoRefresh === option.value ? colors.accent.default : colors.fg.default,
                }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Error Banner */}
      {error && (
        <View style={{
          marginHorizontal: spacing[3],
          marginTop: spacing[3],
          padding: spacing[3],
          backgroundColor: colors.status.error + '15',
          borderRadius: radius.md,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <AlertTriangle size={18} color={colors.status.error} />
          <Text style={{
            flex: 1,
            marginLeft: spacing[2],
            fontSize: 13,
            fontFamily: fonts.sans.regular,
            color: colors.status.error,
          }}>
            {error}
          </Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <X size={18} color={colors.status.error} />
          </TouchableOpacity>
        </View>
      )}

      {/* Loading State */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent.default} />
        </View>
      ) : !systemInfo ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[6] }}>
          <Ionicons name="analytics-outline" size={48} color={colors.fg.subtle} />
          <Text style={{
            fontSize: 14,
            fontFamily: fonts.sans.medium,
            color: colors.fg.muted,
            marginTop: spacing[4],
          }}>
            No system info available
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing[3] }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent.default}
            />
          }
        >
          {/* CPU Section */}
          <Section
            title="CPU"
            icon="speedometer-outline"
            expanded={cpuExpanded}
            onToggle={() => setCpuExpanded(!cpuExpanded)}
            rightContent={
              <View style={{
                paddingHorizontal: spacing[2],
                paddingVertical: 2,
                borderRadius: radius.sm,
                backgroundColor: getUsageColor(systemInfo.cpu.usage, colors) + '20',
              }}>
                <Text style={{
                  fontSize: 12,
                  fontFamily: fonts.mono.regular,
                  color: getUsageColor(systemInfo.cpu.usage, colors),
                }}>
                  {systemInfo.cpu.usage.toFixed(0)}%
                </Text>
              </View>
            }
          >
            {/* Hero stat */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: spacing[3],
            }}>
              <Text style={{
                fontSize: 32,
                fontFamily: fonts.mono.regular,
                color: colors.fg.default,
              }}>
                {systemInfo.cpu.usage.toFixed(0)}%
              </Text>
              <Text style={{
                fontSize: 13,
                fontFamily: fonts.sans.regular,
                color: colors.fg.muted,
                marginBottom: spacing[1],
              }}>
                {systemInfo.cpu.cores.length} cores
              </Text>
            </View>

            <ProgressBar percent={systemInfo.cpu.usage} color={getUsageColor(systemInfo.cpu.usage, colors)} height={8} />

            {/* Core Grid */}
            {systemInfo.cpu.cores.length > 0 && (
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                marginTop: spacing[4],
                gap: spacing[2],
              }}>
                {systemInfo.cpu.cores.map((usage, i) => (
                  <View key={i} style={{
                    width: `${100 / coreColumns - 2}%`,
                    backgroundColor: colors.bg.base,
                    borderRadius: radius.sm,
                    padding: spacing[2],
                    alignItems: 'center',
                  }}>
                    <Text style={{
                      fontSize: 10,
                      fontFamily: fonts.sans.regular,
                      color: colors.fg.muted,
                    }}>
                      {i}
                    </Text>
                    <Text style={{
                      fontSize: 13,
                      fontFamily: fonts.mono.regular,
                      color: getUsageColor(usage, colors),
                    }}>
                      {usage.toFixed(0)}%
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Section>

          {/* Memory Section */}
          <Section
            title="Memory"
            icon="hardware-chip-outline"
            expanded={memoryExpanded}
            onToggle={() => setMemoryExpanded(!memoryExpanded)}
            rightContent={
              <View style={{
                paddingHorizontal: spacing[2],
                paddingVertical: 2,
                borderRadius: radius.sm,
                backgroundColor: getUsageColor(systemInfo.memory.usedPercent, colors) + '20',
              }}>
                <Text style={{
                  fontSize: 12,
                  fontFamily: fonts.mono.regular,
                  color: getUsageColor(systemInfo.memory.usedPercent, colors),
                }}>
                  {systemInfo.memory.usedPercent.toFixed(0)}%
                </Text>
              </View>
            }
          >
            <View style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: spacing[3],
            }}>
              <Text style={{
                fontSize: 32,
                fontFamily: fonts.mono.regular,
                color: colors.fg.default,
              }}>
                {systemInfo.memory.usedPercent.toFixed(0)}%
              </Text>
              <Text style={{
                fontSize: 13,
                fontFamily: fonts.sans.regular,
                color: colors.fg.muted,
                marginBottom: spacing[1],
              }}>
                {formatBytes(systemInfo.memory.used)} / {formatBytes(systemInfo.memory.total)}
              </Text>
            </View>

            <ProgressBar percent={systemInfo.memory.usedPercent} color={getUsageColor(systemInfo.memory.usedPercent, colors)} height={8} />

            {/* Memory breakdown */}
            <View style={{
              flexDirection: 'row',
              marginTop: spacing[4],
              gap: spacing[2],
            }}>
              <View style={{
                flex: 1,
                backgroundColor: colors.bg.base,
                borderRadius: radius.sm,
                padding: spacing[3],
              }}>
                <Text style={{
                  fontSize: 10,
                  fontFamily: fonts.sans.regular,
                  color: colors.fg.muted,
                  textTransform: 'uppercase',
                  marginBottom: spacing[1],
                }}>
                  Used
                </Text>
                <Text style={{
                  fontSize: 14,
                  fontFamily: fonts.mono.regular,
                  color: colors.fg.default,
                }}>
                  {formatBytes(systemInfo.memory.used)}
                </Text>
              </View>
              <View style={{
                flex: 1,
                backgroundColor: colors.bg.base,
                borderRadius: radius.sm,
                padding: spacing[3],
              }}>
                <Text style={{
                  fontSize: 10,
                  fontFamily: fonts.sans.regular,
                  color: colors.fg.muted,
                  textTransform: 'uppercase',
                  marginBottom: spacing[1],
                }}>
                  Free
                </Text>
                <Text style={{
                  fontSize: 14,
                  fontFamily: fonts.mono.regular,
                  color: colors.status.success,
                }}>
                  {formatBytes(systemInfo.memory.free)}
                </Text>
              </View>
            </View>
          </Section>

          {/* Storage Section */}
          <Section
            title="Storage"
            icon="server-outline"
            expanded={storageExpanded}
            onToggle={() => setStorageExpanded(!storageExpanded)}
            rightContent={
              <Text style={{
                fontSize: 11,
                fontFamily: fonts.sans.regular,
                color: colors.fg.muted,
              }}>
                {systemInfo.disk.length} volume{systemInfo.disk.length !== 1 ? 's' : ''}
              </Text>
            }
          >
            {systemInfo.disk.map((disk, i) => (
              <View
                key={i}
                style={{
                  backgroundColor: colors.bg.base,
                  borderRadius: radius.md,
                  padding: spacing[3],
                  marginBottom: i < systemInfo.disk.length - 1 ? spacing[2] : 0,
                }}
              >
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: spacing[2],
                }}>
                  <Text style={{
                    fontSize: 16,
                    fontFamily: fonts.mono.regular,
                    color: colors.accent.default,
                  }}>
                    {disk.mount}
                  </Text>
                  <View style={{
                    paddingHorizontal: spacing[2],
                    paddingVertical: 2,
                    borderRadius: radius.sm,
                    backgroundColor: getUsageColor(disk.usedPercent, colors) + '20',
                  }}>
                    <Text style={{
                      fontSize: 11,
                      fontFamily: fonts.mono.regular,
                      color: getUsageColor(disk.usedPercent, colors),
                    }}>
                      {disk.usedPercent.toFixed(0)}%
                    </Text>
                  </View>
                </View>
                <ProgressBar percent={disk.usedPercent} color={getUsageColor(disk.usedPercent, colors)} />
                <Text style={{
                  marginTop: spacing[2],
                  fontSize: 12,
                  fontFamily: fonts.sans.regular,
                  color: colors.fg.muted,
                }}>
                  {formatBytes(disk.used)} / {formatBytes(disk.size)}
                </Text>
              </View>
            ))}
          </Section>

          {/* Battery (compact row, not collapsible) */}
          {systemInfo.battery.hasBattery && (
            <View style={{
              backgroundColor: colors.bg.raised,
              borderRadius: radius.md,
              padding: spacing[4],
              marginBottom: spacing[3],
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: radius.md,
                backgroundColor: (systemInfo.battery.percent < 20 ? colors.status.error : colors.status.success) + '20',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons
                  name={systemInfo.battery.charging ? 'battery-charging' : systemInfo.battery.percent < 20 ? 'battery-dead' : 'battery-half'}
                  size={20}
                  color={systemInfo.battery.percent < 20 ? colors.status.error : colors.status.success}
                />
              </View>
              <View style={{ flex: 1, marginLeft: spacing[3] }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: spacing[2],
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                    <Text style={{
                      fontSize: 18,
                      fontFamily: fonts.mono.regular,
                      color: colors.fg.default,
                    }}>
                      {systemInfo.battery.percent.toFixed(0)}%
                    </Text>
                    {systemInfo.battery.charging && (
                      <View style={{
                        paddingHorizontal: spacing[2],
                        paddingVertical: 2,
                        borderRadius: radius.sm,
                        backgroundColor: colors.status.success + '20',
                      }}>
                        <Text style={{
                          fontSize: 10,
                          fontFamily: fonts.sans.bold,
                          color: colors.status.success,
                        }}>
                          CHARGING
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={{
                    fontSize: 11,
                    fontFamily: fonts.sans.regular,
                    color: colors.fg.muted,
                  }}>
                    Battery
                  </Text>
                </View>
                <ProgressBar
                  percent={systemInfo.battery.percent}
                  color={systemInfo.battery.percent < 20 ? colors.status.error : colors.status.success}
                />
              </View>
            </View>
          )}

          {/* Last Updated */}
          {lastUpdated && (
            <View style={{
              alignItems: 'center',
              paddingVertical: spacing[3],
            }}>
              <Text style={{
                fontSize: 12,
                fontFamily: fonts.sans.regular,
                color: colors.fg.subtle,
              }}>
                Updated {getRelativeTime(lastUpdated)}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

export default memo(MonitorPanel);
