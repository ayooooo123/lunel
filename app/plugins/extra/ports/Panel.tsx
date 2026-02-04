import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Menu, Search, X, RefreshCw, AlertTriangle, CloudOff, Wifi, Terminal } from 'lucide-react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import { PluginPanelProps } from '../../types';
import { useApi, PortInfo, ApiError } from '@/hooks/useApi';

function PortsPanel({ instanceId, isActive }: PluginPanelProps) {
  const { colors, fonts, spacing, radius } = useTheme();
  const navigation = useNavigation();
  const openDrawer = () => navigation.dispatch(DrawerActions.openDrawer());
  const { ports: portsApi, isConnected } = useApi();

  const [portsList, setPortsList] = useState<PortInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [killingPorts, setKillingPorts] = useState<Set<number>>(new Set());

  // Load ports
  const loadPorts = useCallback(async () => {
    if (!isConnected) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const result = await portsApi.list();
      setPortsList(result);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load ports';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isConnected, portsApi]);

  // Load on mount and when active
  useEffect(() => {
    if (isActive && isConnected) {
      loadPorts();
    }
  }, [isActive, isConnected, loadPorts]);

  // Auto-refresh every 10 seconds when active
  useEffect(() => {
    if (!isActive || !isConnected) return;
    const interval = setInterval(loadPorts, 10000);
    return () => clearInterval(interval);
  }, [isActive, isConnected, loadPorts]);

  const killPort = async (port: number) => {
    setKillingPorts(prev => new Set(prev).add(port));
    try {
      await portsApi.kill(port);
      await loadPorts();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to kill port';
      Alert.alert('Error', message);
    } finally {
      setKillingPorts(prev => {
        const next = new Set(prev);
        next.delete(port);
        return next;
      });
    }
  };

  const filteredPorts = filter
    ? portsList.filter(p =>
        p.port.toString().includes(filter) ||
        p.process.toLowerCase().includes(filter.toLowerCase())
      )
    : portsList;

  // Group ports by process
  const groupedPorts = filteredPorts.reduce((acc, port) => {
    const processName = port.process || 'unknown';
    if (!acc[processName]) acc[processName] = [];
    acc[processName].push(port);
    return acc;
  }, {} as Record<string, PortInfo[]>);

  // Sort groups by process name
  const sortedGroups = Object.entries(groupedPorts).sort(([a], [b]) => a.localeCompare(b));

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
            <Menu size={22} color={colors.fg.default} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={{
            flex: 1,
            fontSize: 17,
            fontFamily: fonts.sans.semibold,
            color: colors.fg.default,
          }}>
            Ports
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[6] }}>
          <CloudOff size={48} color={colors.fg.subtle} strokeWidth={1.5} />
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
            Connect to view listening ports
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
          <Menu size={22} color={colors.fg.default} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={{
          flex: 1,
          fontSize: 17,
          fontFamily: fonts.sans.semibold,
          color: colors.fg.default,
        }}>
          Ports
        </Text>
        <TouchableOpacity
          onPress={() => setShowSearch(!showSearch)}
          style={{ padding: spacing[3] }}
        >
          {showSearch ? (
            <X size={20} color={colors.fg.muted} strokeWidth={2} />
          ) : (
            <Search size={20} color={colors.fg.muted} strokeWidth={2} />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { setLoading(true); loadPorts(); }} style={{ padding: spacing[3] }}>
          <RefreshCw size={20} color={colors.fg.muted} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={{ paddingHorizontal: spacing[3], paddingBottom: spacing[3] }}>
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
            value={filter}
            onChangeText={setFilter}
            placeholder="Filter by port or process..."
            placeholderTextColor={colors.fg.muted}
            autoFocus
          />
        </View>
      )}

      {/* Error Banner */}
      {error && (
        <View style={{
          marginHorizontal: spacing[3],
          marginBottom: spacing[3],
          padding: spacing[3],
          backgroundColor: colors.status.error + '15',
          borderRadius: radius.md,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <AlertTriangle size={18} color={colors.status.error} strokeWidth={2} />
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
            <X size={18} color={colors.status.error} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      )}

      {/* Port Count */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[4],
        paddingBottom: spacing[3],
      }}>
        <Text style={{
          fontSize: 12,
          fontFamily: fonts.sans.medium,
          color: colors.fg.muted,
        }}>
          {filteredPorts.length} listening port{filteredPorts.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Loading State */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent.default} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: spacing[3] }}
          showsVerticalScrollIndicator={false}
        >
          {sortedGroups.map(([process, processPorts]) => (
            <View key={process} style={{ marginBottom: spacing[4] }}>
              {/* Process Header */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing[2],
                marginBottom: spacing[2],
              }}>
                <Terminal size={14} color={colors.fg.muted} strokeWidth={2} />
                <Text style={{
                  fontSize: 12,
                  fontFamily: fonts.sans.semibold,
                  color: colors.fg.muted,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}>
                  {process}
                </Text>
                <Text style={{
                  fontSize: 11,
                  fontFamily: fonts.sans.regular,
                  color: colors.fg.subtle,
                }}>
                  ({processPorts.length})
                </Text>
              </View>

              {/* Port Cards for this process */}
              {processPorts.map((port, index) => (
                <View
                  key={`${port.port}-${port.pid}-${index}`}
                  style={{
                    backgroundColor: colors.bg.raised,
                    borderRadius: radius.md,
                    padding: spacing[4],
                    marginBottom: spacing[2],
                  }}
                >
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    {/* Port Number & Info */}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                        <Text style={{
                          fontSize: 24,
                          fontFamily: fonts.mono.regular,
                          color: colors.accent.default,
                        }}>
                          :{port.port}
                        </Text>
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
                            LISTEN
                          </Text>
                        </View>
                      </View>
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing[3],
                        marginTop: spacing[2],
                      }}>
                        <Text style={{
                          fontSize: 12,
                          fontFamily: fonts.mono.regular,
                          color: colors.fg.muted,
                        }}>
                          PID {port.pid}
                        </Text>
                        {port.address && (
                          <Text style={{
                            fontSize: 12,
                            fontFamily: fonts.mono.regular,
                            color: colors.fg.subtle,
                          }}>
                            {port.address}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Kill Button */}
                    <TouchableOpacity
                      onPress={() => killPort(port.port)}
                      disabled={killingPorts.has(port.port)}
                      style={{
                        paddingHorizontal: spacing[4],
                        paddingVertical: spacing[3],
                        borderRadius: radius.md,
                        backgroundColor: killingPorts.has(port.port)
                          ? colors.status.error + '30'
                          : colors.status.error + '15',
                        minWidth: 60,
                        alignItems: 'center',
                      }}
                    >
                      {killingPorts.has(port.port) ? (
                        <ActivityIndicator size="small" color={colors.status.error} />
                      ) : (
                        <Text style={{
                          fontSize: 13,
                          fontFamily: fonts.sans.semibold,
                          color: colors.status.error,
                        }}>
                          Kill
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))}

          {filteredPorts.length === 0 && (
            <View style={{
              alignItems: 'center',
              paddingVertical: spacing[8],
            }}>
              <Wifi size={48} color={colors.fg.subtle} strokeWidth={1.5} />
              <Text style={{
                fontSize: 14,
                fontFamily: fonts.sans.medium,
                color: colors.fg.muted,
                marginTop: spacing[4],
              }}>
                {filter ? 'No matching ports' : 'No listening ports'}
              </Text>
            </View>
          )}

          <View style={{ height: spacing[8] }} />
        </ScrollView>
      )}
    </View>
  );
}

export default memo(PortsPanel);
