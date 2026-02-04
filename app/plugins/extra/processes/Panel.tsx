import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {
  Menu,
  X,
  Search,
  Plus,
  RefreshCw,
  AlertTriangle,
  CloudOff,
  Terminal,
  ChevronRight,
  Trash,
} from 'lucide-react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import { PluginPanelProps } from '../../types';
import { useApi, ProcessInfo, ApiError } from '@/hooks/useApi';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function ProcessesPanel({ instanceId, isActive }: PluginPanelProps) {
  const { colors, fonts, spacing, radius } = useTheme();
  const navigation = useNavigation();
  const openDrawer = () => navigation.dispatch(DrawerActions.openDrawer());
  const { processes: processApi, isConnected } = useApi();

  const [processList, setProcessList] = useState<ProcessInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<ProcessInfo | null>(null);
  const [processOutput, setProcessOutput] = useState<string>('');
  const [outputLoading, setOutputLoading] = useState(false);
  const [killing, setKilling] = useState(false);

  // Spawn modal state
  const [showSpawnModal, setShowSpawnModal] = useState(false);
  const [spawnCommand, setSpawnCommand] = useState('');
  const [spawnArgs, setSpawnArgs] = useState('');
  const [spawning, setSpawning] = useState(false);

  // Process modal animations
  const [processModalVisible, setProcessModalVisible] = useState(false);
  const processBackdropOpacity = useRef(new Animated.Value(0)).current;
  const processSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Load processes
  const loadProcesses = useCallback(async () => {
    if (!isConnected) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const result = await processApi.list();
      setProcessList(result);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load processes';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isConnected, processApi]);

  // Load on mount and when active
  useEffect(() => {
    if (isActive && isConnected) {
      loadProcesses();
    }
  }, [isActive, isConnected, loadProcesses]);

  // Auto-refresh every 5 seconds when active
  useEffect(() => {
    if (!isActive || !isConnected) return;
    const interval = setInterval(loadProcesses, 5000);
    return () => clearInterval(interval);
  }, [isActive, isConnected, loadProcesses]);

  // Load output when process selected
  useEffect(() => {
    if (selectedProcess) {
      setProcessModalVisible(true);
      setOutputLoading(true);
      processApi.getOutput(selectedProcess.channel)
        .then(output => setProcessOutput(output))
        .catch(() => setProcessOutput(''))
        .finally(() => setOutputLoading(false));

      Animated.parallel([
        Animated.timing(processBackdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(processSlideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(processBackdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(processSlideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setProcessModalVisible(false);
        setProcessOutput('');
      });
    }
  }, [selectedProcess]);

  const killProcess = async (pid: number) => {
    setKilling(true);
    try {
      await processApi.kill(pid);
      setSelectedProcess(null);
      await loadProcesses();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to kill process';
      setError(message);
    } finally {
      setKilling(false);
    }
  };

  const spawnProcess = async () => {
    if (!spawnCommand.trim()) return;

    setSpawning(true);
    try {
      const args = spawnArgs.trim() ? spawnArgs.split(' ') : undefined;
      await processApi.spawn(spawnCommand.trim(), args);
      setShowSpawnModal(false);
      setSpawnCommand('');
      setSpawnArgs('');
      await loadProcesses();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to spawn process';
      setError(message);
    } finally {
      setSpawning(false);
    }
  };

  const clearOutput = async () => {
    if (!selectedProcess) return;
    try {
      await processApi.clearOutput(selectedProcess.channel);
      setProcessOutput('');
    } catch {
      // Ignore errors
    }
  };

  const refreshOutput = async () => {
    if (!selectedProcess) return;
    setOutputLoading(true);
    try {
      const output = await processApi.getOutput(selectedProcess.channel);
      setProcessOutput(output);
    } catch {
      // Ignore errors
    } finally {
      setOutputLoading(false);
    }
  };

  const getStatusColor = (status: ProcessInfo['status']) => {
    switch (status) {
      case 'running': return colors.status.success;
      case 'stopped': return colors.status.error;
      default: return colors.fg.muted;
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatDuration = (startTime: number) => {
    const elapsed = Date.now() - startTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const filteredProcesses = filter
    ? processList.filter(p =>
        p.command.toLowerCase().includes(filter.toLowerCase()) ||
        p.pid.toString().includes(filter)
      )
    : processList;

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
            Processes
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
            Connect to view and manage processes
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
          Processes
        </Text>
        <TouchableOpacity
          onPress={() => setShowSearch(!showSearch)}
          style={{ padding: spacing[3] }}
        >
          {showSearch ? (
            <X size={20} color={colors.fg.muted} />
          ) : (
            <Search size={20} color={colors.fg.muted} />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowSpawnModal(true)} style={{ padding: spacing[3] }}>
          <Plus size={22} color={colors.fg.muted} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { setLoading(true); loadProcesses(); }} style={{ padding: spacing[3] }}>
          <RefreshCw size={20} color={colors.fg.muted} />
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
            placeholder="Filter by command or PID..."
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

      {/* Process Count */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[4],
        paddingBottom: spacing[3],
        gap: spacing[3],
      }}>
        <Text style={{
          fontSize: 12,
          fontFamily: fonts.sans.medium,
          color: colors.fg.muted,
        }}>
          {filteredProcesses.length} process{filteredProcesses.length !== 1 ? 'es' : ''}
        </Text>
        <View style={{
          width: 4,
          height: 4,
          borderRadius: radius.full,
          backgroundColor: colors.fg.subtle,
        }} />
        <Text style={{
          fontSize: 12,
          fontFamily: fonts.sans.medium,
          color: colors.status.success,
        }}>
          {processList.filter(p => p.status === 'running').length} running
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
          {filteredProcesses.map((process) => (
            <TouchableOpacity
              key={process.pid}
              onPress={() => setSelectedProcess(process)}
              activeOpacity={0.7}
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
                <View style={{ flex: 1, marginRight: spacing[3] }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                    <Text style={{
                      fontSize: 15,
                      fontFamily: fonts.mono.regular,
                      color: colors.fg.default,
                    }} numberOfLines={1}>
                      {process.command}
                    </Text>
                    <View style={{
                      paddingHorizontal: spacing[2],
                      paddingVertical: 2,
                      borderRadius: radius.sm,
                      backgroundColor: getStatusColor(process.status) + '20',
                    }}>
                      <Text style={{
                        fontSize: 9,
                        fontFamily: fonts.sans.bold,
                        color: getStatusColor(process.status),
                        textTransform: 'uppercase',
                      }}>
                        {process.status}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: spacing[3] }}>
                    <Text style={{
                      fontSize: 12,
                      fontFamily: fonts.mono.regular,
                      color: colors.fg.muted,
                    }}>
                      PID {process.pid}
                    </Text>
                    <Text style={{
                      fontSize: 12,
                      fontFamily: fonts.sans.regular,
                      color: colors.fg.subtle,
                    }}>
                      {formatDuration(process.startTime)}
                    </Text>
                  </View>
                  {process.cwd && (
                    <Text style={{
                      fontSize: 11,
                      fontFamily: fonts.mono.regular,
                      color: colors.fg.subtle,
                      marginTop: 4,
                    }} numberOfLines={1}>
                      {process.cwd}
                    </Text>
                  )}
                </View>
                <ChevronRight size={18} color={colors.fg.subtle} />
              </View>
            </TouchableOpacity>
          ))}

          {filteredProcesses.length === 0 && (
            <View style={{
              alignItems: 'center',
              paddingVertical: spacing[8],
            }}>
              <Terminal size={48} color={colors.fg.subtle} />
              <Text style={{
                fontSize: 14,
                fontFamily: fonts.sans.medium,
                color: colors.fg.muted,
                marginTop: spacing[4],
              }}>
                {filter ? 'No matching processes' : 'No managed processes'}
              </Text>
              <Text style={{
                fontSize: 12,
                fontFamily: fonts.sans.regular,
                color: colors.fg.subtle,
                marginTop: spacing[2],
                textAlign: 'center',
              }}>
                {!filter && 'Tap + to spawn a new process'}
              </Text>
            </View>
          )}

          <View style={{ height: spacing[8] }} />
        </ScrollView>
      )}

      {/* Spawn Modal */}
      <Modal
        visible={showSpawnModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSpawnModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          padding: spacing[4],
        }}>
          <View style={{
            backgroundColor: colors.bg.overlay,
            borderRadius: radius.lg,
            padding: spacing[4],
          }}>
            <Text style={{
              fontSize: 17,
              fontFamily: fonts.sans.semibold,
              color: colors.fg.default,
              marginBottom: spacing[4],
            }}>
              Spawn Process
            </Text>

            <Text style={{
              fontSize: 12,
              fontFamily: fonts.sans.medium,
              color: colors.fg.muted,
              marginBottom: spacing[2],
            }}>
              Command
            </Text>
            <TextInput
              style={{
                paddingHorizontal: spacing[4],
                paddingVertical: spacing[3],
                borderRadius: radius.md,
                fontSize: 14,
                fontFamily: fonts.mono.regular,
                color: colors.fg.default,
                backgroundColor: colors.bg.raised,
                marginBottom: spacing[3],
              }}
              value={spawnCommand}
              onChangeText={setSpawnCommand}
              placeholder="e.g., node, npm, python"
              placeholderTextColor={colors.fg.muted}
              autoFocus
            />

            <Text style={{
              fontSize: 12,
              fontFamily: fonts.sans.medium,
              color: colors.fg.muted,
              marginBottom: spacing[2],
            }}>
              Arguments (space-separated)
            </Text>
            <TextInput
              style={{
                paddingHorizontal: spacing[4],
                paddingVertical: spacing[3],
                borderRadius: radius.md,
                fontSize: 14,
                fontFamily: fonts.mono.regular,
                color: colors.fg.default,
                backgroundColor: colors.bg.raised,
                marginBottom: spacing[4],
              }}
              value={spawnArgs}
              onChangeText={setSpawnArgs}
              placeholder="e.g., run dev --port 3000"
              placeholderTextColor={colors.fg.muted}
            />

            <View style={{ flexDirection: 'row', gap: spacing[3] }}>
              <TouchableOpacity
                onPress={() => setShowSpawnModal(false)}
                style={{
                  flex: 1,
                  backgroundColor: colors.bg.raised,
                  borderRadius: radius.md,
                  paddingVertical: spacing[3],
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: 15,
                  fontFamily: fonts.sans.semibold,
                  color: colors.fg.muted,
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={spawnProcess}
                disabled={spawning || !spawnCommand.trim()}
                style={{
                  flex: 1,
                  backgroundColor: spawning || !spawnCommand.trim()
                    ? colors.accent.default + '50'
                    : colors.accent.default,
                  borderRadius: radius.md,
                  paddingVertical: spacing[3],
                  alignItems: 'center',
                }}
              >
                {spawning ? (
                  <ActivityIndicator size="small" color={colors.accent.fg} />
                ) : (
                  <Text style={{
                    fontSize: 15,
                    fontFamily: fonts.sans.semibold,
                    color: colors.accent.fg,
                  }}>
                    Spawn
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Process Detail Modal */}
      <Modal
        visible={processModalVisible}
        transparent
        animationType="none"
        onRequestClose={() => setSelectedProcess(null)}
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
              opacity: processBackdropOpacity,
            }}
          >
            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={() => setSelectedProcess(null)}
            />
          </Animated.View>
          <Animated.View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '80%',
            backgroundColor: colors.bg.overlay,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
            transform: [{ translateY: processSlideAnim }],
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: spacing[4],
            }}>
              <Text style={{
                fontSize: 17,
                fontFamily: fonts.sans.semibold,
                color: colors.fg.default,
              }}>
                Process Details
              </Text>
              <TouchableOpacity onPress={() => setSelectedProcess(null)}>
                <X size={24} color={colors.fg.muted} />
              </TouchableOpacity>
            </View>

            {selectedProcess && (
              <ScrollView style={{ flex: 1 }}>
                {/* Process Info */}
                <View style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[4] }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                    <View style={{
                      paddingHorizontal: spacing[2],
                      paddingVertical: 2,
                      borderRadius: radius.sm,
                      backgroundColor: getStatusColor(selectedProcess.status) + '20',
                    }}>
                      <Text style={{
                        fontSize: 10,
                        fontFamily: fonts.sans.bold,
                        color: getStatusColor(selectedProcess.status),
                        textTransform: 'uppercase',
                      }}>
                        {selectedProcess.status}
                      </Text>
                    </View>
                    <Text style={{
                      fontSize: 13,
                      fontFamily: fonts.mono.regular,
                      color: colors.fg.muted,
                    }}>
                      PID {selectedProcess.pid}
                    </Text>
                  </View>

                  <Text style={{
                    fontSize: 16,
                    fontFamily: fonts.mono.regular,
                    color: colors.fg.default,
                    marginTop: spacing[2],
                  }}>
                    {selectedProcess.command}
                  </Text>

                  <Text style={{
                    fontSize: 12,
                    fontFamily: fonts.sans.regular,
                    color: colors.fg.subtle,
                    marginTop: spacing[2],
                  }}>
                    Started {formatTime(selectedProcess.startTime)} ({formatDuration(selectedProcess.startTime)} ago)
                  </Text>

                  {selectedProcess.cwd && (
                    <Text style={{
                      fontSize: 12,
                      fontFamily: fonts.mono.regular,
                      color: colors.fg.muted,
                      marginTop: spacing[2],
                    }} numberOfLines={2}>
                      {selectedProcess.cwd}
                    </Text>
                  )}
                </View>

                {/* Output Section */}
                <View style={{ paddingHorizontal: spacing[4] }}>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: spacing[2],
                  }}>
                    <Text style={{
                      fontSize: 13,
                      fontFamily: fonts.sans.semibold,
                      color: colors.fg.default,
                    }}>
                      Output
                    </Text>
                    <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                      <TouchableOpacity onPress={refreshOutput} style={{ padding: spacing[1] }}>
                        <RefreshCw size={18} color={colors.fg.muted} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={clearOutput} style={{ padding: spacing[1] }}>
                        <Trash size={18} color={colors.fg.muted} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={{
                    backgroundColor: colors.bg.base,
                    borderRadius: radius.md,
                    padding: spacing[3],
                    minHeight: 200,
                    maxHeight: 300,
                  }}>
                    {outputLoading ? (
                      <ActivityIndicator size="small" color={colors.accent.default} />
                    ) : processOutput ? (
                      <ScrollView>
                        <Text style={{
                          fontSize: 12,
                          fontFamily: fonts.mono.regular,
                          color: colors.fg.default,
                        }}>
                          {processOutput}
                        </Text>
                      </ScrollView>
                    ) : (
                      <Text style={{
                        fontSize: 12,
                        fontFamily: fonts.sans.regular,
                        color: colors.fg.subtle,
                        fontStyle: 'italic',
                      }}>
                        No output
                      </Text>
                    )}
                  </View>
                </View>

                {/* Kill Button */}
                {selectedProcess.status === 'running' && (
                  <View style={{ padding: spacing[4] }}>
                    <TouchableOpacity
                      onPress={() => killProcess(selectedProcess.pid)}
                      disabled={killing}
                      style={{
                        backgroundColor: killing
                          ? colors.status.error + '30'
                          : colors.status.error + '15',
                        borderRadius: radius.md,
                        paddingVertical: spacing[4],
                        alignItems: 'center',
                      }}
                    >
                      {killing ? (
                        <ActivityIndicator size="small" color={colors.status.error} />
                      ) : (
                        <Text style={{
                          fontSize: 15,
                          fontFamily: fonts.sans.semibold,
                          color: colors.status.error,
                        }}>
                          Kill Process
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                <View style={{ height: spacing[8] }} />
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

export default memo(ProcessesPanel);
