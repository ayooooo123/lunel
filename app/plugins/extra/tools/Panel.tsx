import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  Menu,
  Clipboard as ClipboardIcon,
  RefreshCw,
  X,
  ArrowUpDown,
  Copy,
  Share2,
  AlertCircle,
  Sparkles,
  Clock,
  Code,
  Lock,
  Fingerprint,
  Type,
  Minimize2,
  FileText,
  LockOpen,
  Link2,
  Unlink,
  ArrowLeftRight,
  Scissors,
  Minus,
  Calendar,
  Timer,
} from 'lucide-react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import { PluginPanelProps } from '../../types';
import { gPI } from '../../gpi';
import { lunelApi } from '@/lib/storage';

const HISTORY_KEY = 'tool-history';

type ContentType = 'json' | 'xml' | 'timestamp' | 'base64' | 'url-encoded' | 'text';
type ToolCategory = 'suggested' | 'format' | 'encode' | 'hash' | 'string' | 'time';

interface Tool {
  id: string;
  label: string;
  category: ToolCategory[];
  icon: React.ComponentType<any>;
  action: (input: string) => Promise<string>;
  placeholder?: string;
}

// Icon mapping for tools
const iconMap: Record<string, React.ComponentType<any>> = {
  'code-slash': Code,
  'contract': Minimize2,
  'document-text': FileText,
  'lock-closed': Lock,
  'lock-open': LockOpen,
  'link': Link2,
  'unlink': Unlink,
  'finger-print': Fingerprint,
  'text': Type,
};

function ToolsPanel({ instanceId, isActive }: PluginPanelProps) {
  const { colors, fonts, spacing, radius } = useTheme();
  const navigation = useNavigation();
  const openDrawer = () => navigation.dispatch(DrawerActions.openDrawer());

  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'recent'>('suggested');
  const [lastUsedTool, setLastUsedTool] = useState<string | null>(null);
  const [recentToolIds, setRecentToolIds] = useState<string[]>([]);

  // Load recent tools on mount
  useEffect(() => {
    lunelApi.storage.jsons.read<string[]>(HISTORY_KEY).then(data => {
      if (data) setRecentToolIds(data);
    });
  }, []);

  // Save recent tool
  const addToRecent = useCallback((toolId: string) => {
    setRecentToolIds(prev => {
      const filtered = prev.filter(id => id !== toolId);
      const updated = [toolId, ...filtered].slice(0, 5);
      lunelApi.storage.jsons.write(HISTORY_KEY, updated);
      return updated;
    });
  }, []);

  // Paste from clipboard
  const pasteFromClipboard = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setInput(text);
      setError('');
    }
  };

  // Share output
  const shareOutput = async () => {
    if (output) {
      try {
        await Share.share({ message: output });
      } catch (e) {
        // User cancelled or error
      }
    }
  };

  // Content detection
  const detectedType = useMemo((): ContentType => {
    const trimmed = input.trim();
    if (!trimmed) return 'text';

    // JSON detection
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        JSON.parse(trimmed);
        return 'json';
      } catch {}
    }

    // XML detection
    if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
      return 'xml';
    }

    // Unix timestamp (10 or 13 digits)
    if (/^\d{10,13}$/.test(trimmed)) {
      return 'timestamp';
    }

    // Base64 detection (basic heuristic)
    if (/^[A-Za-z0-9+/]+=*$/.test(trimmed) && trimmed.length > 20 && trimmed.length % 4 === 0) {
      return 'base64';
    }

    // URL encoded detection
    if (/%[0-9A-Fa-f]{2}/.test(trimmed)) {
      return 'url-encoded';
    }

    return 'text';
  }, [input]);

  // All tools definition
  const tools: Tool[] = useMemo(() => [
    // Format tools
    {
      id: 'json-format',
      label: 'Format JSON',
      category: ['format', 'suggested'],
      icon: Code,
      action: async (input) => gPI.tools.formatJson(input),
      placeholder: '{"key": "value"}',
    },
    {
      id: 'json-minify',
      label: 'Minify JSON',
      category: ['format'],
      icon: Minimize2,
      action: async (input) => JSON.stringify(JSON.parse(input)),
    },
    {
      id: 'xml-format',
      label: 'Format XML',
      category: ['format'],
      icon: FileText,
      action: async (input) => gPI.tools.formatXml(input),
      placeholder: '<root><item>value</item></root>',
    },
    // Encode tools
    {
      id: 'base64-encode',
      label: 'Base64 Encode',
      category: ['encode'],
      icon: Lock,
      action: async (input) => gPI.tools.base64Encode(input),
    },
    {
      id: 'base64-decode',
      label: 'Base64 Decode',
      category: ['encode', 'suggested'],
      icon: LockOpen,
      action: async (input) => gPI.tools.base64Decode(input),
    },
    {
      id: 'url-encode',
      label: 'URL Encode',
      category: ['encode'],
      icon: Link2,
      action: async (input) => gPI.tools.urlEncode(input),
    },
    {
      id: 'url-decode',
      label: 'URL Decode',
      category: ['encode', 'suggested'],
      icon: Unlink,
      action: async (input) => gPI.tools.urlDecode(input),
    },
    // Hash tools
    {
      id: 'hash-md5',
      label: 'MD5',
      category: ['hash'],
      icon: Fingerprint,
      action: async (input) => gPI.tools.hash(input, 'md5'),
    },
    {
      id: 'hash-sha1',
      label: 'SHA-1',
      category: ['hash'],
      icon: Fingerprint,
      action: async (input) => gPI.tools.hash(input, 'sha1'),
    },
    {
      id: 'hash-sha256',
      label: 'SHA-256',
      category: ['hash', 'suggested'],
      icon: Fingerprint,
      action: async (input) => gPI.tools.hash(input, 'sha256'),
    },
    {
      id: 'hash-sha512',
      label: 'SHA-512',
      category: ['hash'],
      icon: Fingerprint,
      action: async (input) => gPI.tools.hash(input, 'sha512'),
    },
    // String tools
    {
      id: 'string-lower',
      label: 'lowercase',
      category: ['string'],
      icon: Type,
      action: async (input) => gPI.tools.stringOps(input, 'lowercase'),
    },
    {
      id: 'string-upper',
      label: 'UPPERCASE',
      category: ['string'],
      icon: Type,
      action: async (input) => gPI.tools.stringOps(input, 'uppercase'),
    },
    {
      id: 'string-capitalize',
      label: 'Capitalize',
      category: ['string'],
      icon: Type,
      action: async (input) => gPI.tools.stringOps(input, 'capitalize'),
    },
    {
      id: 'string-reverse',
      label: 'Reverse',
      category: ['string'],
      icon: ArrowLeftRight,
      action: async (input) => gPI.tools.stringOps(input, 'reverse'),
    },
    {
      id: 'string-trim',
      label: 'Trim',
      category: ['string'],
      icon: Scissors,
      action: async (input) => gPI.tools.stringOps(input, 'trim'),
    },
    {
      id: 'string-slug',
      label: 'Slugify',
      category: ['string'],
      icon: Minus,
      action: async (input) => gPI.tools.stringOps(input, 'slug'),
    },
    // Time tools
    {
      id: 'time-unix-to-date',
      label: 'Unix → Date',
      category: ['time', 'suggested'],
      icon: Calendar,
      action: async (input) => gPI.tools.unixToDate(parseInt(input)),
      placeholder: '1703548800',
    },
    {
      id: 'time-date-to-unix',
      label: 'Date → Unix',
      category: ['time'],
      icon: Clock,
      action: async (input) => (await gPI.tools.dateToUnix(input)).toString(),
      placeholder: '2024-12-26T00:00:00Z',
    },
    {
      id: 'time-now',
      label: 'Now (Unix)',
      category: ['time'],
      icon: Timer,
      action: async () => Math.floor(Date.now() / 1000).toString(),
    },
  ], []);

  // Smart suggestions based on detected content
  const smartSuggestions = useMemo(() => {
    const suggestions: Tool[] = [];

    switch (detectedType) {
      case 'json':
        suggestions.push(
          tools.find(t => t.id === 'json-format')!,
          tools.find(t => t.id === 'json-minify')!,
        );
        break;
      case 'xml':
        suggestions.push(tools.find(t => t.id === 'xml-format')!);
        break;
      case 'timestamp':
        suggestions.push(tools.find(t => t.id === 'time-unix-to-date')!);
        break;
      case 'base64':
        suggestions.push(tools.find(t => t.id === 'base64-decode')!);
        break;
      case 'url-encoded':
        suggestions.push(tools.find(t => t.id === 'url-decode')!);
        break;
      default:
        // Default suggestions for plain text
        suggestions.push(
          tools.find(t => t.id === 'base64-encode')!,
          tools.find(t => t.id === 'hash-sha256')!,
          tools.find(t => t.id === 'url-encode')!,
        );
    }

    return suggestions.filter(Boolean);
  }, [detectedType, tools]);

  // Get recent tools
  const recentTools = useMemo(() => {
    return recentToolIds
      .map(id => tools.find(t => t.id === id))
      .filter(Boolean) as Tool[];
  }, [recentToolIds, tools]);

  // Filter tools by category
  const filteredTools = useMemo(() => {
    if (activeCategory === 'suggested') {
      return smartSuggestions;
    }
    if (activeCategory === 'recent') {
      return recentTools;
    }
    return tools.filter(t => t.category.includes(activeCategory));
  }, [activeCategory, tools, smartSuggestions, recentTools]);

  const runTool = useCallback(async (tool: Tool) => {
    if (!input.trim() && tool.id !== 'time-now') {
      setError('Enter some input first');
      return;
    }

    try {
      const result = await tool.action(input);
      setOutput(result);
      setError('');
      setLastUsedTool(tool.id);
      addToRecent(tool.id);
    } catch (e: any) {
      setError(e.message || 'Operation failed');
      setOutput('');
    }
  }, [input, addToRecent]);

  const swapInputOutput = () => {
    if (output) {
      setInput(output);
      setOutput('');
      setError('');
    }
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError('');
    setLastUsedTool(null);
  };

  const copyOutput = async () => {
    if (output) {
      await Clipboard.setStringAsync(output);
    }
  };

  const categories: { id: ToolCategory | 'recent'; label: string; icon: React.ComponentType<any> }[] = [
    { id: 'suggested', label: 'Smart', icon: Sparkles },
    ...(recentToolIds.length > 0 ? [{ id: 'recent' as const, label: 'Recent', icon: Clock }] : []),
    { id: 'format', label: 'Format', icon: Code },
    { id: 'encode', label: 'Encode', icon: Lock },
    { id: 'hash', label: 'Hash', icon: Fingerprint },
    { id: 'string', label: 'String', icon: Type },
    { id: 'time', label: 'Time', icon: Clock },
  ];

  // Equal split for input/output
  const inputFlex = 1;
  const outputFlex = 1;

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
          color: colors.fg.default
        }}>
          Tools
        </Text>
        <TouchableOpacity
          onPress={pasteFromClipboard}
          style={{ padding: spacing[3] }}
        >
          <ClipboardIcon size={20} color={colors.fg.muted} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={clearAll}
          disabled={!input && !output}
          style={{
            padding: spacing[3],
            opacity: (input || output) ? 1 : 0.3,
          }}
        >
          <RefreshCw size={20} color={colors.fg.muted} />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={{ flex: 1, padding: spacing[3], paddingTop: 0 }}>

        {/* Input Section */}
        <View style={{ flex: inputFlex, marginBottom: spacing[3] }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing[2]
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
              <Text style={{
                fontSize: 12,
                fontFamily: fonts.sans.semibold,
                color: colors.fg.muted,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                Input
              </Text>
              {detectedType !== 'text' && input.trim() && (
                <View style={{
                  backgroundColor: colors.accent.default + '20',
                  paddingHorizontal: spacing[2],
                  paddingVertical: 2,
                  borderRadius: radius.sm,
                }}>
                  <Text style={{
                    fontSize: 10,
                    fontFamily: fonts.sans.medium,
                    color: colors.accent.default,
                    textTransform: 'uppercase',
                  }}>
                    {detectedType}
                  </Text>
                </View>
              )}
            </View>
            {input && (
              <Text style={{
                fontSize: 11,
                fontFamily: fonts.mono.regular,
                color: colors.fg.muted
              }}>
                {input.length} chars
              </Text>
            )}
          </View>
          <View style={{ flex: 1, position: 'relative' }}>
            <TextInput
              style={{
                flex: 1,
                padding: spacing[4],
                paddingRight: input ? 48 : spacing[4],
                borderRadius: radius.lg,
                fontSize: 14,
                fontFamily: fonts.mono.regular,
                color: colors.fg.default,
                backgroundColor: colors.bg.raised,
                textAlignVertical: 'top',
                lineHeight: 22,
              }}
              value={input}
              onChangeText={(text) => {
                setInput(text);
                setError('');
              }}
              placeholder={
                (filteredTools.length > 0 && filteredTools[0]?.placeholder) ||
                'Paste or type anything...'
              }
              placeholderTextColor={colors.fg.muted + '80'}
              multiline
            />
            {input.length > 0 && (
              <TouchableOpacity
                onPress={() => { setInput(''); setError(''); }}
                style={{
                  position: 'absolute',
                  top: spacing[3],
                  right: spacing[3],
                  padding: spacing[1],
                  backgroundColor: colors.bg.overlay,
                  borderRadius: radius.full,
                }}
              >
                <X size={16} color={colors.fg.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Swap Button - always visible, disabled when no output */}
        <TouchableOpacity
          onPress={swapInputOutput}
          disabled={!output}
          style={{
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing[2],
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[2],
            borderRadius: radius.full,
            backgroundColor: colors.bg.overlay,
            marginBottom: spacing[3],
            opacity: output ? 1 : 0.3,
          }}
        >
          <ArrowUpDown size={16} color={colors.accent.default} />
          <Text style={{
            fontSize: 12,
            fontFamily: fonts.sans.medium,
            color: colors.accent.default,
          }}>
            Use as input
          </Text>
        </TouchableOpacity>

        {/* Output Section */}
        <View style={{ flex: outputFlex, marginBottom: spacing[3] }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing[2]
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
              <Text style={{
                fontSize: 12,
                fontFamily: fonts.sans.semibold,
                color: colors.fg.muted,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                Output
              </Text>
              {lastUsedTool && output && (
                <Text style={{
                  fontSize: 11,
                  fontFamily: fonts.sans.regular,
                  color: colors.fg.muted,
                }}>
                  via {tools.find(t => t.id === lastUsedTool)?.label}
                </Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: spacing[2] }}>
              <TouchableOpacity
                onPress={copyOutput}
                disabled={!output}
                style={{ padding: spacing[1], opacity: output ? 1 : 0.3 }}
              >
                <Copy size={18} color={colors.fg.muted} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={shareOutput}
                disabled={!output}
                style={{ padding: spacing[1], opacity: output ? 1 : 0.3 }}
              >
                <Share2 size={18} color={colors.fg.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <View style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: spacing[3],
              padding: spacing[4],
              borderRadius: radius.lg,
              backgroundColor: colors.status.error + '15',
            }}>
              <AlertCircle size={20} color={colors.status.error} />
              <Text style={{
                flex: 1,
                fontSize: 13,
                fontFamily: fonts.sans.regular,
                color: colors.status.error,
                lineHeight: 20,
              }}>
                {error}
              </Text>
            </View>
          ) : (
            <ScrollView
              style={{
                flex: 1,
                padding: spacing[4],
                borderRadius: radius.lg,
                backgroundColor: colors.bg.raised,
              }}
              showsVerticalScrollIndicator={false}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: fonts.mono.regular,
                  color: output ? colors.fg.default : colors.fg.muted + '60',
                  lineHeight: 22,
                }}
                selectable
              >
                {output || 'Result appears here'}
              </Text>
            </ScrollView>
          )}
        </View>
      </View>

      {/* Bottom Action Bar */}
      <View style={{ backgroundColor: colors.bg.raised }}>
        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[3],
            gap: spacing[2],
          }}
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            const IconComponent = cat.icon;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setActiveCategory(cat.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing[2],
                  paddingHorizontal: spacing[4],
                  paddingVertical: spacing[2],
                  borderRadius: radius.full,
                  backgroundColor: isActive ? colors.accent.default : colors.bg.overlay,
                }}
              >
                <IconComponent
                  size={14}
                  color={isActive ? '#fff' : colors.fg.muted}
                  strokeWidth={2}
                />
                <Text style={{
                  fontSize: 13,
                  fontFamily: fonts.sans.medium,
                  color: isActive ? '#fff' : colors.fg.muted,
                }}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tool Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing[3],
            paddingBottom: spacing[4],
            gap: spacing[2],
          }}
        >
          {filteredTools.map((tool) => {
            const ToolIcon = tool.icon;
            return (
              <TouchableOpacity
                key={tool.id}
                onPress={() => runTool(tool)}
                style={{
                  minWidth: 80,
                  paddingHorizontal: spacing[4],
                  paddingVertical: spacing[3],
                  borderRadius: radius.md,
                  backgroundColor: colors.bg.base,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                activeOpacity={0.7}
              >
                <ToolIcon
                  size={20}
                  color={colors.fg.default}
                  strokeWidth={2}
                  style={{ marginBottom: spacing[1] }}
                />
              <Text style={{
                fontSize: 12,
                fontFamily: fonts.sans.medium,
                color: colors.fg.default,
                textAlign: 'center',
              }}>
                {tool.label}
              </Text>
            </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

export default memo(ToolsPanel);
