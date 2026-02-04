import React, { useState, useCallback, useEffect, memo } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Menu, RefreshCw, GitBranch, ArrowUp, ArrowDown, AlertCircle, CheckCircle2, GitCommit as GitCommitIcon, Plus, CloudOff, Pencil, PlusCircle, Trash, ArrowRight, FileText, HelpCircle, MinusCircle } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import { useConnection } from '@/contexts/ConnectionContext';
import { useApi, GitStatus, GitCommit, ApiError } from '@/hooks/useApi';
import { PluginPanelProps } from '../../types';

type Tab = 'changes' | 'history' | 'branches';

function GitPanel({ instanceId, isActive }: PluginPanelProps) {
  const { colors, fonts, spacing, radius } = useTheme();
  const navigation = useNavigation();
  const openDrawer = () => navigation.dispatch(DrawerActions.openDrawer());

  const { status: connStatus } = useConnection();
  const { git } = useApi();
  const isConnected = connStatus === 'connected';

  const [activeTab, setActiveTab] = useState<Tab>('changes');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Git data
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [branches, setBranches] = useState<{ current: string; branches: string[] } | null>(null);

  // UI state
  const [commitMessage, setCommitMessage] = useState('');
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Load git data
  const loadStatus = useCallback(async () => {
    if (!isConnected) return;
    try {
      const status = await git.status();
      setGitStatus(status);
      setError(null);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.code === 'ENOTGIT') {
        setError('Not a git repository');
      } else {
        setError(apiError.message || 'Failed to load status');
      }
    }
  }, [isConnected, git]);

  const loadCommits = useCallback(async () => {
    if (!isConnected) return;
    try {
      const log = await git.log(30);
      setCommits(log);
    } catch (err) {
      console.error('Failed to load commits:', err);
    }
  }, [isConnected, git]);

  const loadBranches = useCallback(async () => {
    if (!isConnected) return;
    try {
      const branchData = await git.branches();
      setBranches(branchData);
    } catch (err) {
      console.error('Failed to load branches:', err);
    }
  }, [isConnected, git]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadStatus(), loadCommits(), loadBranches()]);
    setLoading(false);
  }, [loadStatus, loadCommits, loadBranches]);

  // Load on mount and when panel becomes active
  useEffect(() => {
    if (isConnected && isActive) {
      loadAll();
    }
  }, [isConnected, isActive]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  // Stage files
  const handleStage = async (paths: string[]) => {
    setActionLoading(true);
    try {
      await git.stage(paths);
      await loadStatus();
    } catch (err) {
      const apiError = err as ApiError;
      Alert.alert('Error', apiError.message || 'Failed to stage files');
    } finally {
      setActionLoading(false);
    }
  };

  // Unstage files
  const handleUnstage = async (paths: string[]) => {
    setActionLoading(true);
    try {
      await git.unstage(paths);
      await loadStatus();
    } catch (err) {
      const apiError = err as ApiError;
      Alert.alert('Error', apiError.message || 'Failed to unstage files');
    } finally {
      setActionLoading(false);
    }
  };

  // Commit
  const handleCommit = async () => {
    if (!commitMessage.trim()) return;
    setActionLoading(true);
    try {
      await git.commit(commitMessage.trim());
      setCommitMessage('');
      setShowCommitModal(false);
      await loadAll();
    } catch (err) {
      const apiError = err as ApiError;
      Alert.alert('Error', apiError.message || 'Failed to commit');
    } finally {
      setActionLoading(false);
    }
  };

  // Pull
  const handlePull = async () => {
    setActionLoading(true);
    try {
      const result = await git.pull();
      Alert.alert('Pull', result.summary || 'Pull completed');
      await loadAll();
    } catch (err) {
      const apiError = err as ApiError;
      Alert.alert('Error', apiError.message || 'Failed to pull');
    } finally {
      setActionLoading(false);
    }
  };

  // Push
  const handlePush = async () => {
    setActionLoading(true);
    try {
      await git.push();
      Alert.alert('Success', 'Push completed');
      await loadStatus();
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.message?.includes('no upstream') || apiError.message?.includes('set-upstream')) {
        Alert.alert(
          'Set Upstream?',
          'This branch has no upstream. Do you want to push and set upstream?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Push with Upstream',
              onPress: async () => {
                try {
                  await git.push(true);
                  Alert.alert('Success', 'Push completed');
                  await loadStatus();
                } catch (e) {
                  Alert.alert('Error', (e as ApiError).message || 'Failed to push');
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', apiError.message || 'Failed to push');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Checkout branch
  const handleCheckout = async (branch: string) => {
    setActionLoading(true);
    try {
      await git.checkout(branch);
      await loadAll();
    } catch (err) {
      const apiError = err as ApiError;
      Alert.alert('Error', apiError.message || 'Failed to checkout');
    } finally {
      setActionLoading(false);
    }
  };

  // Create branch
  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;
    setActionLoading(true);
    try {
      await git.checkout(newBranchName.trim(), true);
      setNewBranchName('');
      setShowBranchModal(false);
      await loadAll();
    } catch (err) {
      const apiError = err as ApiError;
      Alert.alert('Error', apiError.message || 'Failed to create branch');
    } finally {
      setActionLoading(false);
    }
  };

  // Discard changes
  const handleDiscard = async (paths?: string[]) => {
    Alert.alert(
      'Discard Changes',
      paths ? `Discard changes to ${paths.length} file(s)?` : 'Discard all changes?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await git.discard(paths);
              await loadStatus();
            } catch (err) {
              const apiError = err as ApiError;
              Alert.alert('Error', apiError.message || 'Failed to discard');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // Stage all
  const handleStageAll = () => {
    if (!gitStatus) return;
    const allPaths = [
      ...gitStatus.unstaged.map(f => f.path),
      ...gitStatus.untracked,
    ];
    if (allPaths.length > 0) {
      handleStage(allPaths);
    }
  };

  // Unstage all
  const handleUnstageAll = () => {
    if (!gitStatus) return;
    const allPaths = gitStatus.staged.map(f => f.path);
    if (allPaths.length > 0) {
      handleUnstage(allPaths);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'M': return { icon: 'create-outline', color: colors.status.warning };
      case 'A': return { icon: 'add-circle-outline', color: colors.status.success };
      case 'D': return { icon: 'trash-outline', color: colors.status.error };
      case 'R': return { icon: 'arrow-forward-outline', color: colors.status.info };
      default: return { icon: 'document-outline', color: colors.fg.muted };
    }
  };

  const getStatusIconComponent = (status: string, color: string) => {
    switch (status) {
      case 'M': return <Pencil size={16} color={color} strokeWidth={2} />;
      case 'A': return <PlusCircle size={16} color={color} strokeWidth={2} />;
      case 'D': return <Trash size={16} color={color} strokeWidth={2} />;
      case 'R': return <ArrowRight size={16} color={color} strokeWidth={2} />;
      default: return <FileText size={16} color={color} strokeWidth={2} />;
    }
  };

  const hasChanges = gitStatus && (
    gitStatus.staged.length > 0 ||
    gitStatus.unstaged.length > 0 ||
    gitStatus.untracked.length > 0
  );

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
          Git
        </Text>
        {actionLoading && <ActivityIndicator size="small" color={colors.accent.default} style={{ marginRight: spacing[2] }} />}
        <TouchableOpacity onPress={onRefresh} style={{ padding: spacing[3] }}>
          <RefreshCw size={20} color={colors.fg.muted} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Branch & Sync Bar */}
      {gitStatus && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing[4],
          paddingBottom: spacing[3],
          gap: spacing[2],
        }}>
          <TouchableOpacity
            onPress={() => setShowBranchModal(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing[2],
              paddingHorizontal: spacing[3],
              paddingVertical: spacing[2],
              borderRadius: radius.md,
              backgroundColor: colors.bg.raised,
            }}
          >
            <GitBranch size={16} color={colors.accent.default} strokeWidth={2} />
            <Text style={{
              fontSize: 13,
              fontFamily: fonts.mono.regular,
              color: colors.fg.default,
            }}>
              {gitStatus.branch}
            </Text>
            {(gitStatus.ahead > 0 || gitStatus.behind > 0) && (
              <View style={{ flexDirection: 'row', gap: spacing[1] }}>
                {gitStatus.ahead > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ArrowUp size={12} color={colors.status.success} strokeWidth={2} />
                    <Text style={{ fontSize: 11, color: colors.status.success }}>{gitStatus.ahead}</Text>
                  </View>
                )}
                {gitStatus.behind > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ArrowDown size={12} color={colors.status.warning} strokeWidth={2} />
                    <Text style={{ fontSize: 11, color: colors.status.warning }}>{gitStatus.behind}</Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          <TouchableOpacity
            onPress={handlePull}
            disabled={actionLoading}
            style={{
              padding: spacing[2],
              borderRadius: radius.md,
              backgroundColor: colors.bg.raised,
            }}
          >
            <ArrowDown size={18} color={colors.fg.default} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePush}
            disabled={actionLoading}
            style={{
              padding: spacing[2],
              borderRadius: radius.md,
              backgroundColor: colors.bg.raised,
            }}
          >
            <ArrowUp size={18} color={colors.fg.default} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      )}

      {/* Tabs */}
      <View style={{
        flexDirection: 'row',
        paddingHorizontal: spacing[4],
        marginBottom: spacing[3],
        gap: spacing[2],
      }}>
        {(['changes', 'history', 'branches'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              paddingHorizontal: spacing[4],
              paddingVertical: spacing[2],
              borderRadius: radius.full,
              backgroundColor: activeTab === tab ? colors.accent.default : colors.bg.raised,
            }}
          >
            <Text style={{
              fontSize: 13,
              fontFamily: fonts.sans.medium,
              color: activeTab === tab ? '#fff' : colors.fg.muted,
              textTransform: 'capitalize',
            }}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing[4], paddingBottom: spacing[4] }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.default} />
        }
      >
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: spacing[8] }}>
            <ActivityIndicator size="large" color={colors.accent.default} />
          </View>
        ) : error ? (
          <View style={{ alignItems: 'center', paddingVertical: spacing[8] }}>
            <AlertCircle size={48} color={colors.status.error} strokeWidth={1.5} />
            <Text style={{
              fontSize: 14,
              fontFamily: fonts.sans.medium,
              color: colors.status.error,
              marginTop: spacing[3],
            }}>
              {error}
            </Text>
          </View>
        ) : activeTab === 'changes' && gitStatus ? (
          <>
            {/* Staged Files */}
            {gitStatus.staged.length > 0 && (
              <View style={{ marginBottom: spacing[4] }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: spacing[2],
                }}>
                  <Text style={{
                    fontSize: 12,
                    fontFamily: fonts.sans.semibold,
                    color: colors.status.success,
                    textTransform: 'uppercase',
                  }}>
                    Staged ({gitStatus.staged.length})
                  </Text>
                  <TouchableOpacity onPress={handleUnstageAll}>
                    <Text style={{ fontSize: 12, fontFamily: fonts.sans.medium, color: colors.fg.muted }}>
                      Unstage All
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={{ backgroundColor: colors.bg.raised, borderRadius: radius.md, overflow: 'hidden' }}>
                  {gitStatus.staged.map((file, i) => {
                    const statusInfo = getStatusIcon(file.status);
                    return (
                      <TouchableOpacity
                        key={file.path}
                        onPress={() => handleUnstage([file.path])}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: spacing[3],
                          borderTopWidth: i > 0 ? 1 : 0,
                          borderTopColor: colors.bg.overlay,
                          gap: spacing[3],
                        }}
                      >
                        <Ionicons name={statusInfo.icon as any} size={16} color={statusInfo.color} />
                        <Text style={{
                          flex: 1,
                          fontSize: 13,
                          fontFamily: fonts.mono.regular,
                          color: colors.fg.default,
                        }} numberOfLines={1}>
                          {file.path}
                        </Text>
                        <MinusCircle size={18} color={colors.fg.muted} strokeWidth={2} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Unstaged Files */}
            {(gitStatus.unstaged.length > 0 || gitStatus.untracked.length > 0) && (
              <View style={{ marginBottom: spacing[4] }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: spacing[2],
                }}>
                  <Text style={{
                    fontSize: 12,
                    fontFamily: fonts.sans.semibold,
                    color: colors.status.warning,
                    textTransform: 'uppercase',
                  }}>
                    Changes ({gitStatus.unstaged.length + gitStatus.untracked.length})
                  </Text>
                  <View style={{ flexDirection: 'row', gap: spacing[3] }}>
                    <TouchableOpacity onPress={() => handleDiscard()}>
                      <Text style={{ fontSize: 12, fontFamily: fonts.sans.medium, color: colors.status.error }}>
                        Discard All
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleStageAll}>
                      <Text style={{ fontSize: 12, fontFamily: fonts.sans.medium, color: colors.fg.muted }}>
                        Stage All
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{ backgroundColor: colors.bg.raised, borderRadius: radius.md, overflow: 'hidden' }}>
                  {gitStatus.unstaged.map((file, i) => {
                    const statusInfo = getStatusIcon(file.status);
                    return (
                      <TouchableOpacity
                        key={file.path}
                        onPress={() => handleStage([file.path])}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: spacing[3],
                          borderTopWidth: i > 0 ? 1 : 0,
                          borderTopColor: colors.bg.overlay,
                          gap: spacing[3],
                        }}
                      >
                        {getStatusIconComponent(file.status, statusInfo.color)}
                        <Text style={{
                          flex: 1,
                          fontSize: 13,
                          fontFamily: fonts.mono.regular,
                          color: colors.fg.default,
                        }} numberOfLines={1}>
                          {file.path}
                        </Text>
                        <PlusCircle size={18} color={colors.fg.muted} strokeWidth={2} />
                      </TouchableOpacity>
                    );
                  })}
                  {gitStatus.untracked.map((path, i) => (
                    <TouchableOpacity
                      key={path}
                      onPress={() => handleStage([path])}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: spacing[3],
                        borderTopWidth: gitStatus.unstaged.length > 0 || i > 0 ? 1 : 0,
                        borderTopColor: colors.bg.overlay,
                        gap: spacing[3],
                      }}
                    >
                      <HelpCircle size={16} color={colors.fg.subtle} strokeWidth={2} />
                      <Text style={{
                        flex: 1,
                        fontSize: 13,
                        fontFamily: fonts.mono.regular,
                        color: colors.fg.muted,
                      }} numberOfLines={1}>
                        {path}
                      </Text>
                      <Text style={{ fontSize: 10, fontFamily: fonts.sans.medium, color: colors.fg.subtle }}>
                        UNTRACKED
                      </Text>
                      <Ionicons name="add-circle-outline" size={18} color={colors.fg.muted} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Commit Button */}
            {gitStatus.staged.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowCommitModal(true)}
                style={{
                  backgroundColor: colors.accent.default,
                  borderRadius: radius.md,
                  paddingVertical: spacing[4],
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: 15,
                  fontFamily: fonts.sans.semibold,
                  color: '#fff',
                }}>
                  Commit {gitStatus.staged.length} file{gitStatus.staged.length !== 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            )}

            {/* Clean State */}
            {!hasChanges && (
              <View style={{ alignItems: 'center', paddingVertical: spacing[8] }}>
                <CheckCircle2 size={48} color={colors.status.success} strokeWidth={1.5} />
                <Text style={{
                  fontSize: 14,
                  fontFamily: fonts.sans.medium,
                  color: colors.fg.muted,
                  marginTop: spacing[3],
                }}>
                  Working tree clean
                </Text>
              </View>
            )}
          </>
        ) : activeTab === 'history' ? (
          <View style={{ backgroundColor: colors.bg.raised, borderRadius: radius.md, overflow: 'hidden' }}>
            {commits.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: spacing[8] }}>
                <GitCommitIcon size={48} color={colors.fg.subtle} strokeWidth={1.5} />
                <Text style={{
                  fontSize: 14,
                  fontFamily: fonts.sans.medium,
                  color: colors.fg.muted,
                  marginTop: spacing[3],
                }}>
                  No commits yet
                </Text>
              </View>
            ) : (
              commits.map((commit, i) => (
                <View
                  key={commit.hash}
                  style={{
                    padding: spacing[3],
                    borderTopWidth: i > 0 ? 1 : 0,
                    borderTopColor: colors.bg.overlay,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
                    <Text style={{
                      fontSize: 12,
                      fontFamily: fonts.mono.regular,
                      color: colors.accent.default,
                    }}>
                      {commit.hash.substring(0, 7)}
                    </Text>
                    <Text style={{
                      fontSize: 11,
                      fontFamily: fonts.sans.regular,
                      color: colors.fg.muted,
                    }}>
                      {new Date(commit.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={{
                    fontSize: 14,
                    fontFamily: fonts.sans.regular,
                    color: colors.fg.default,
                  }} numberOfLines={2}>
                    {commit.message}
                  </Text>
                  <Text style={{
                    fontSize: 11,
                    fontFamily: fonts.sans.regular,
                    color: colors.fg.muted,
                    marginTop: spacing[1],
                  }}>
                    {commit.author}
                  </Text>
                </View>
              ))
            )}
          </View>
        ) : activeTab === 'branches' && branches ? (
          <>
            <TouchableOpacity
              onPress={() => setShowBranchModal(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing[2],
                paddingVertical: spacing[3],
                borderRadius: radius.md,
                backgroundColor: colors.bg.raised,
                marginBottom: spacing[3],
              }}
            >
              <Plus size={18} color={colors.accent.default} strokeWidth={2} />
              <Text style={{ fontSize: 14, fontFamily: fonts.sans.medium, color: colors.accent.default }}>
                New Branch
              </Text>
            </TouchableOpacity>

            <View style={{ backgroundColor: colors.bg.raised, borderRadius: radius.md, overflow: 'hidden' }}>
              {branches.branches.map((branch, i) => (
                <TouchableOpacity
                  key={branch}
                  onPress={() => branch !== branches.current && handleCheckout(branch)}
                  disabled={branch === branches.current}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: spacing[3],
                    borderTopWidth: i > 0 ? 1 : 0,
                    borderTopColor: colors.bg.overlay,
                    gap: spacing[3],
                    backgroundColor: branch === branches.current ? colors.accent.subtle : 'transparent',
                  }}
                >
                  {branch === branches.current ? (
                    <CheckCircle2 size={18} color={colors.accent.default} strokeWidth={2} />
                  ) : (
                    <GitBranch size={18} color={colors.fg.muted} strokeWidth={2} />
                  )}
                  <Text style={{
                    flex: 1,
                    fontSize: 14,
                    fontFamily: fonts.mono.regular,
                    color: branch === branches.current ? colors.accent.default : colors.fg.default,
                  }}>
                    {branch}
                  </Text>
                  {branch === branches.current && (
                    <Text style={{ fontSize: 10, fontFamily: fonts.sans.bold, color: colors.accent.default }}>
                      CURRENT
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      {/* Commit Modal */}
      <Modal
        visible={showCommitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCommitModal(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setShowCommitModal(false)}
        >
          <View style={{
            backgroundColor: colors.bg.raised,
            borderRadius: radius.lg,
            width: '90%',
            maxWidth: 400,
            padding: spacing[4],
          }}>
            <Text style={{
              fontSize: 17,
              fontFamily: fonts.sans.semibold,
              color: colors.fg.default,
              marginBottom: spacing[4],
            }}>
              Commit Message
            </Text>
            <TextInput
              style={{
                minHeight: 100,
                padding: spacing[3],
                borderRadius: radius.md,
                fontSize: 14,
                fontFamily: fonts.sans.regular,
                color: colors.fg.default,
                backgroundColor: colors.bg.base,
                textAlignVertical: 'top',
                marginBottom: spacing[4],
              }}
              value={commitMessage}
              onChangeText={setCommitMessage}
              placeholder="Describe your changes..."
              placeholderTextColor={colors.fg.muted}
              multiline
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: spacing[2] }}>
              <TouchableOpacity
                onPress={() => setShowCommitModal(false)}
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
                onPress={handleCommit}
                disabled={!commitMessage.trim() || actionLoading}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: spacing[3],
                  borderRadius: radius.md,
                  backgroundColor: commitMessage.trim() ? colors.accent.default : colors.bg.overlay,
                }}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{
                    fontSize: 14,
                    fontFamily: fonts.sans.medium,
                    color: commitMessage.trim() ? '#fff' : colors.fg.muted,
                  }}>
                    Commit
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Branch Modal */}
      <Modal
        visible={showBranchModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBranchModal(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setShowBranchModal(false)}
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
              Create New Branch
            </Text>
            <TextInput
              style={{
                paddingHorizontal: spacing[4],
                paddingVertical: spacing[3],
                borderRadius: radius.md,
                fontSize: 14,
                fontFamily: fonts.mono.regular,
                color: colors.fg.default,
                backgroundColor: colors.bg.base,
                marginBottom: spacing[4],
              }}
              value={newBranchName}
              onChangeText={setNewBranchName}
              placeholder="feature/my-branch"
              placeholderTextColor={colors.fg.muted}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={{ flexDirection: 'row', gap: spacing[2] }}>
              <TouchableOpacity
                onPress={() => setShowBranchModal(false)}
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
                onPress={handleCreateBranch}
                disabled={!newBranchName.trim() || actionLoading}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: spacing[3],
                  borderRadius: radius.md,
                  backgroundColor: newBranchName.trim() ? colors.accent.default : colors.bg.overlay,
                }}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{
                    fontSize: 14,
                    fontFamily: fonts.sans.medium,
                    color: newBranchName.trim() ? '#fff' : colors.fg.muted,
                  }}>
                    Create
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export default memo(GitPanel);
