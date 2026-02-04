import React, { useState, useRef, useEffect, memo } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Animated,
  Dimensions,
  Switch,
} from 'react-native';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
import { Menu, Clock, ChevronDown, ChevronRight, X, Plus, Copy, Cloud, Monitor, Search, CheckSquare, Square } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/contexts/ThemeContext';
import { PluginPanelProps } from '../../types';
import { lunelApi } from '@/lib/storage';
import { useApi, ApiError } from '@/hooks/useApi';

const HISTORY_KEY = 'http-history';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface Header {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
}

interface HistoryItem {
  id: string;
  timestamp: string;
  request: {
    method: HttpMethod;
    url: string;
    headers: Header[];
    body: string;
  };
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    time: number;
  };
  viaCli?: boolean;
}

async function loadHistory(): Promise<HistoryItem[]> {
  const data = await lunelApi.storage.jsons.read<HistoryItem[]>(HISTORY_KEY);
  return data || [];
}

async function saveHistory(history: HistoryItem[]) {
  await lunelApi.storage.jsons.write(HISTORY_KEY, history);
}

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: '#22c55e',
  POST: '#3b82f6',
  PUT: '#f59e0b',
  DELETE: '#ef4444',
  PATCH: '#a855f7',
};

function HttpPanel({ instanceId, isActive }: PluginPanelProps) {
  const { colors, fonts, spacing, radius } = useTheme();
  const navigation = useNavigation();
  const openDrawer = () => navigation.dispatch(DrawerActions.openDrawer());
  const { http: httpApi, isConnected } = useApi();

  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');
  const [headers, setHeaders] = useState<Header[]>([
    { id: '1', key: 'Content-Type', value: 'application/json', enabled: true },
  ]);
  const [body, setBody] = useState('');
  const [response, setResponse] = useState<HttpResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [useCliProxy, setUseCliProxy] = useState(true);

  // Collapsible sections
  const [requestExpanded, setRequestExpanded] = useState(true);
  const [responseHeadersExpanded, setResponseHeadersExpanded] = useState(false);

  // Load history on mount
  useEffect(() => {
    loadHistory().then(setHistory);
  }, []);

  // History modal animations
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const historyBackdropOpacity = useRef(new Animated.Value(0)).current;
  const historySlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (showHistory) {
      setHistoryModalVisible(true);
      Animated.parallel([
        Animated.timing(historyBackdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(historySlideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(historyBackdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(historySlideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setHistoryModalVisible(false);
      });
    }
  }, [showHistory]);

  const addHeader = () => {
    setHeaders([...headers, { id: Date.now().toString(), key: '', value: '', enabled: true }]);
  };

  const updateHeader = (id: string, field: 'key' | 'value', value: string) => {
    setHeaders(headers.map(h => h.id === id ? { ...h, [field]: value } : h));
  };

  const toggleHeader = (id: string) => {
    setHeaders(headers.map(h => h.id === id ? { ...h, enabled: !h.enabled } : h));
  };

  const removeHeader = (id: string) => {
    setHeaders(headers.filter(h => h.id !== id));
  };

  const sendRequest = async () => {
    setIsLoading(true);
    const startTime = Date.now();

    try {
      // Build headers object from enabled headers
      const reqHeaders: Record<string, string> = {};
      headers.filter(h => h.enabled && h.key).forEach(h => {
        reqHeaders[h.key] = h.value;
      });

      let httpResponse: HttpResponse;

      if (useCliProxy && isConnected) {
        // Send via CLI (allows localhost on PC)
        const result = await httpApi.request({
          method,
          url,
          headers: reqHeaders,
          body: (method === 'POST' || method === 'PUT' || method === 'PATCH') && body ? body : undefined,
          timeout: 30000,
        });

        // Try to pretty-print JSON responses
        let formattedBody = result.body;
        try {
          const parsed = JSON.parse(result.body);
          formattedBody = JSON.stringify(parsed, null, 2);
        } catch {
          // Not JSON, keep as-is
        }

        httpResponse = {
          status: result.status,
          statusText: result.statusText || getStatusText(result.status),
          headers: result.headers,
          body: formattedBody,
          time: result.timing,
        };
      } else {
        // Send directly from app
        const fetchResponse = await fetch(url, {
          method,
          headers: reqHeaders,
          body: (method === 'POST' || method === 'PUT' || method === 'PATCH') && body ? body : undefined,
        });

        const responseBody = await fetchResponse.text();
        const responseHeaders: Record<string, string> = {};
        fetchResponse.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        // Try to pretty-print JSON responses
        let formattedBody = responseBody;
        try {
          const parsed = JSON.parse(responseBody);
          formattedBody = JSON.stringify(parsed, null, 2);
        } catch {
          // Not JSON, keep as-is
        }

        httpResponse = {
          status: fetchResponse.status,
          statusText: fetchResponse.statusText || getStatusText(fetchResponse.status),
          headers: responseHeaders,
          body: formattedBody,
          time: Date.now() - startTime,
        };
      }

      setResponse(httpResponse);
      setIsLoading(false);

      // Add to history and save
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        request: {
          method,
          url,
          headers: headers.filter(h => h.enabled),
          body,
        },
        response: {
          status: httpResponse.status,
          statusText: httpResponse.statusText,
          headers: httpResponse.headers,
          body: httpResponse.body,
          time: httpResponse.time,
        },
        viaCli: useCliProxy && isConnected,
      };
      setHistory(prev => {
        const updated = [newItem, ...prev].slice(0, 50);
        saveHistory(updated);
        return updated;
      });
    } catch (error) {
      const errorMessage = error instanceof ApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Request failed';

      const errorResponse: HttpResponse = {
        status: 0,
        statusText: 'Error',
        headers: {},
        body: errorMessage,
        time: Date.now() - startTime,
      };
      setResponse(errorResponse);
      setIsLoading(false);
    }
  };

  const getStatusText = (status: number): string => {
    const statusTexts: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      301: 'Moved Permanently',
      302: 'Found',
      304: 'Not Modified',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
    };
    return statusTexts[status] || '';
  };

  const loadFromHistory = (item: HistoryItem) => {
    const oldItem = item as any;
    const method = item.request?.method ?? oldItem.method ?? 'GET';
    const url = item.request?.url ?? oldItem.url ?? '';
    const reqHeaders = item.request?.headers ?? [];
    const reqBody = item.request?.body ?? '';

    setMethod(method);
    setUrl(url);
    setHeaders(reqHeaders.length > 0
      ? reqHeaders
      : [{ id: '1', key: 'Content-Type', value: 'application/json', enabled: true }]
    );
    setBody(reqBody);

    if (item.response) {
      setResponse({
        status: item.response.status,
        statusText: item.response.statusText,
        headers: item.response.headers,
        body: item.response.body,
        time: item.response.time,
      });
    }
    setShowHistory(false);
  };

  const copyResponse = async () => {
    if (response?.body) {
      await Clipboard.setStringAsync(response.body);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return colors.status.success;
    if (status >= 300 && status < 400) return colors.status.info;
    if (status >= 400 && status < 500) return colors.status.warning;
    return colors.status.error;
  };

  const Section = ({
    title,
    expanded,
    onToggle,
    children,
    rightContent,
  }: {
    title: string;
    expanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    rightContent?: React.ReactNode;
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
            <ChevronDown size={16} color={colors.fg.muted} strokeWidth={2} />
          ) : (
            <ChevronRight size={16} color={colors.fg.muted} strokeWidth={2} />
          )}
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
          HTTP
        </Text>
        <TouchableOpacity
          onPress={() => setShowHistory(true)}
          style={{ padding: spacing[3] }}
        >
          <Clock size={22} color={colors.fg.muted} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* CLI Proxy Toggle */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        backgroundColor: useCliProxy && isConnected ? colors.accent.default + '10' : 'transparent',
      }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
            <Ionicons
              name={useCliProxy && isConnected ? 'desktop-outline' : 'phone-portrait-outline'}
              size={16}
              color={useCliProxy && isConnected ? colors.accent.default : colors.fg.muted}
            />
            <Text style={{
              fontSize: 13,
              fontFamily: fonts.sans.medium,
              color: useCliProxy && isConnected ? colors.accent.default : colors.fg.muted,
            }}>
              {useCliProxy && isConnected ? 'Via PC (localhost access)' : 'Direct from app'}
            </Text>
          </View>
          {useCliProxy && !isConnected && (
            <Text style={{
              fontSize: 11,
              fontFamily: fonts.sans.regular,
              color: colors.status.warning,
              marginTop: 2,
            }}>
              Not connected - requests will fail
            </Text>
          )}
        </View>
        <Switch
          value={useCliProxy}
          onValueChange={setUseCliProxy}
          trackColor={{ false: colors.bg.overlay, true: colors.accent.default + '50' }}
          thumbColor={useCliProxy ? colors.accent.default : colors.fg.subtle}
        />
      </View>

      {/* URL Bar */}
      <View style={{
        flexDirection: 'row',
        padding: spacing[3],
        gap: spacing[2],
        alignItems: 'center',
      }}>
        <TouchableOpacity
          onPress={() => setShowMethodPicker(true)}
          style={{
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[3],
            borderRadius: radius.md,
            backgroundColor: METHOD_COLORS[method] + '20',
            minWidth: 70,
            alignItems: 'center',
          }}
        >
          <Text style={{
            fontSize: 13,
            fontFamily: fonts.sans.bold,
            color: METHOD_COLORS[method],
          }}>
            {method}
          </Text>
        </TouchableOpacity>

        <TextInput
          style={{
            flex: 1,
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
            borderRadius: radius.md,
            fontSize: 14,
            fontFamily: fonts.mono.regular,
            color: colors.fg.default,
            backgroundColor: colors.bg.raised,
          }}
          value={url}
          onChangeText={setUrl}
          placeholder="https://api.example.com"
          placeholderTextColor={colors.fg.muted}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          onPress={sendRequest}
          disabled={isLoading || !url.trim()}
          style={{
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[3],
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radius.md,
            backgroundColor: isLoading || !url.trim() ? colors.bg.overlay : colors.accent.default,
            minWidth: 70,
          }}
        >
          <Text style={{
            fontSize: 13,
            fontFamily: fonts.sans.bold,
            color: isLoading || !url.trim() ? colors.fg.muted : '#fff',
          }}>
            {isLoading ? 'Sending' : 'Send'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Request Section */}
        <View style={{ paddingHorizontal: spacing[3] }}>
          <Section
            title="Request"
            expanded={requestExpanded}
            onToggle={() => setRequestExpanded(!requestExpanded)}
            rightContent={
              <Text style={{ fontSize: 11, fontFamily: fonts.sans.regular, color: colors.fg.muted }}>
                {headers.filter(h => h.enabled).length} headers
              </Text>
            }
          >
            {/* Headers */}
            <Text style={{
              fontSize: 11,
              fontFamily: fonts.sans.medium,
              color: colors.fg.muted,
              marginBottom: spacing[2],
            }}>
              Headers
            </Text>
            {headers.map((header) => (
              <View
                key={header.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing[2],
                  marginBottom: spacing[2],
                }}
              >
                <TouchableOpacity onPress={() => toggleHeader(header.id)}>
                  {header.enabled ? (
                    <CheckSquare size={20} color={colors.accent.default} strokeWidth={2} />
                  ) : (
                    <Square size={20} color={colors.fg.muted} strokeWidth={2} />
                  )}
                </TouchableOpacity>
                <TextInput
                  style={{
                    flex: 1,
                    paddingHorizontal: spacing[3],
                    paddingVertical: spacing[2],
                    borderRadius: radius.sm,
                    fontSize: 13,
                    fontFamily: fonts.mono.regular,
                    color: header.enabled ? colors.fg.default : colors.fg.muted,
                    backgroundColor: colors.bg.base,
                  }}
                  value={header.key}
                  onChangeText={(v) => updateHeader(header.id, 'key', v)}
                  placeholder="Key"
                  placeholderTextColor={colors.fg.muted}
                />
                <TextInput
                  style={{
                    flex: 1.5,
                    paddingHorizontal: spacing[3],
                    paddingVertical: spacing[2],
                    borderRadius: radius.sm,
                    fontSize: 13,
                    fontFamily: fonts.mono.regular,
                    color: header.enabled ? colors.fg.default : colors.fg.muted,
                    backgroundColor: colors.bg.base,
                  }}
                  value={header.value}
                  onChangeText={(v) => updateHeader(header.id, 'value', v)}
                  placeholder="Value"
                  placeholderTextColor={colors.fg.muted}
                />
                <TouchableOpacity onPress={() => removeHeader(header.id)} style={{ padding: spacing[1] }}>
                  <X size={18} color={colors.fg.muted} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              onPress={addHeader}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing[2],
                paddingVertical: spacing[2],
              }}
            >
              <Plus size={18} color={colors.accent.default} strokeWidth={2} />
              <Text style={{ fontSize: 13, fontFamily: fonts.sans.medium, color: colors.accent.default }}>
                Add header
              </Text>
            </TouchableOpacity>

            {/* Body */}
            {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
              <>
                <Text style={{
                  fontSize: 11,
                  fontFamily: fonts.sans.medium,
                  color: colors.fg.muted,
                  marginTop: spacing[4],
                  marginBottom: spacing[2],
                }}>
                  Body
                </Text>
                <TextInput
                  style={{
                    minHeight: 100,
                    padding: spacing[3],
                    borderRadius: radius.md,
                    fontSize: 13,
                    fontFamily: fonts.mono.regular,
                    color: colors.fg.default,
                    backgroundColor: colors.bg.base,
                    textAlignVertical: 'top',
                  }}
                  value={body}
                  onChangeText={setBody}
                  placeholder='{"key": "value"}'
                  placeholderTextColor={colors.fg.muted}
                  multiline
                />
              </>
            )}
          </Section>
        </View>

        {/* Response Section */}
        <View style={{ paddingHorizontal: spacing[3] }}>
          {response ? (
            <>
              {/* Response Status Bar */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: spacing[3],
                paddingHorizontal: spacing[4],
                backgroundColor: colors.bg.raised,
                borderTopLeftRadius: radius.md,
                borderTopRightRadius: radius.md,
                marginBottom: 1,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                  <View style={{
                    paddingHorizontal: spacing[3],
                    paddingVertical: spacing[1],
                    borderRadius: radius.sm,
                    backgroundColor: getStatusColor(response.status) + '20',
                  }}>
                    <Text style={{
                      fontSize: 13,
                      fontFamily: fonts.sans.bold,
                      color: getStatusColor(response.status),
                    }}>
                      {response.status} {response.statusText}
                    </Text>
                  </View>
                  <Text style={{
                    fontSize: 12,
                    fontFamily: fonts.mono.regular,
                    color: colors.fg.muted,
                  }}>
                    {response.time}ms
                  </Text>
                </View>
                <TouchableOpacity onPress={copyResponse} style={{ padding: spacing[2] }}>
                  <Copy size={18} color={colors.fg.muted} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              {/* Response Body */}
              <View style={{
                backgroundColor: colors.bg.raised,
                padding: spacing[4],
                maxHeight: 400,
              }}>
                <ScrollView
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={true}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: fonts.mono.regular,
                        color: colors.fg.default,
                        lineHeight: 20,
                      }}
                      selectable
                    >
                      {response.body}
                    </Text>
                  </ScrollView>
                </ScrollView>
              </View>

              {/* Response Headers (Collapsible) */}
              <TouchableOpacity
                onPress={() => setResponseHeadersExpanded(!responseHeadersExpanded)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: spacing[3],
                  paddingHorizontal: spacing[4],
                  backgroundColor: colors.bg.raised,
                  borderBottomLeftRadius: responseHeadersExpanded ? undefined : radius.md,
                  borderBottomRightRadius: responseHeadersExpanded ? undefined : radius.md,
                  marginTop: 1,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                  {responseHeadersExpanded ? (
                    <ChevronDown size={14} color={colors.fg.muted} strokeWidth={2} />
                  ) : (
                    <ChevronRight size={14} color={colors.fg.muted} strokeWidth={2} />
                  )}
                  <Text style={{
                    fontSize: 11,
                    fontFamily: fonts.sans.medium,
                    color: colors.fg.muted,
                  }}>
                    Headers ({Object.keys(response.headers).length})
                  </Text>
                </View>
              </TouchableOpacity>
              {responseHeadersExpanded && (
                <View style={{
                  backgroundColor: colors.bg.raised,
                  paddingHorizontal: spacing[4],
                  paddingBottom: spacing[4],
                  borderBottomLeftRadius: radius.md,
                  borderBottomRightRadius: radius.md,
                }}>
                  {Object.entries(response.headers).map(([key, value]) => (
                    <View key={key} style={{ flexDirection: 'row', marginBottom: spacing[1] }}>
                      <Text style={{
                        fontSize: 12,
                        fontFamily: fonts.mono.regular,
                        color: colors.accent.default,
                      }}>
                        {key}:
                      </Text>
                      <Text style={{
                        fontSize: 12,
                        fontFamily: fonts.mono.regular,
                        color: colors.fg.default,
                        marginLeft: spacing[2],
                        flex: 1,
                      }}>
                        {value}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={{
              alignItems: 'center',
              paddingVertical: spacing[8],
              backgroundColor: colors.bg.raised,
              borderRadius: radius.md,
            }}>
              <Cloud size={40} color={colors.fg.subtle} strokeWidth={1.5} />
              <Text style={{
                fontSize: 14,
                fontFamily: fonts.sans.medium,
                color: colors.fg.muted,
                marginTop: spacing[3],
              }}>
                Send a request to see response
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: spacing[8] }} />
      </ScrollView>

      {/* Method Picker Modal */}
      <Modal
        visible={showMethodPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMethodPicker(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setShowMethodPicker(false)}
        >
          <View style={{
            backgroundColor: colors.bg.elevated,
            borderRadius: radius.lg,
            padding: spacing[2],
            minWidth: 150,
          }}>
            {METHODS.map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => {
                  setMethod(m);
                  setShowMethodPicker(false);
                }}
                style={{
                  paddingHorizontal: spacing[4],
                  paddingVertical: spacing[3],
                  borderRadius: radius.md,
                  backgroundColor: method === m ? colors.bg.overlay : 'transparent',
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontFamily: fonts.sans.semibold,
                  color: METHOD_COLORS[m],
                }}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={historyModalVisible}
        transparent
        animationType="none"
        onRequestClose={() => setShowHistory(false)}
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
              opacity: historyBackdropOpacity,
            }}
          >
            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={() => setShowHistory(false)}
            />
          </Animated.View>
          <Animated.View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '70%',
            backgroundColor: colors.bg.overlay,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
            transform: [{ translateY: historySlideAnim }],
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
                History
              </Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <X size={24} color={colors.fg.muted} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }}>
              {history.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: spacing[8] }}>
                  <Clock size={40} color={colors.fg.subtle} strokeWidth={1.5} />
                  <Text style={{
                    fontSize: 14,
                    fontFamily: fonts.sans.medium,
                    color: colors.fg.muted,
                    marginTop: spacing[3],
                  }}>
                    No history yet
                  </Text>
                </View>
              ) : (
                history.map((item) => {
                  const method = item.request?.method ?? (item as any).method ?? 'GET';
                  const url = item.request?.url ?? (item as any).url ?? '';
                  const status = item.response?.status ?? (item as any).status ?? 0;
                  const time = item.response?.time ?? (item as any).time ?? 0;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => loadFromHistory(item)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: spacing[4],
                        paddingVertical: spacing[3],
                        gap: spacing[3],
                      }}
                    >
                      <View style={{
                        paddingHorizontal: spacing[2],
                        paddingVertical: spacing[1],
                        borderRadius: radius.sm,
                        backgroundColor: (METHOD_COLORS[method as HttpMethod] ?? '#888') + '20',
                        minWidth: 50,
                        alignItems: 'center',
                      }}>
                        <Text style={{
                          fontSize: 11,
                          fontFamily: fonts.sans.bold,
                          color: METHOD_COLORS[method as HttpMethod] ?? '#888',
                        }}>
                          {method}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontFamily: fonts.mono.regular,
                            color: colors.fg.default,
                          }}
                          numberOfLines={1}
                        >
                          {url}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: 2 }}>
                          <Text style={{
                            fontSize: 11,
                            fontFamily: fonts.sans.regular,
                            color: colors.fg.muted,
                          }}>
                            {new Date(item.timestamp).toLocaleTimeString()} · {time}ms
                          </Text>
                          {item.viaCli && (
                            <Monitor size={12} color={colors.fg.subtle} strokeWidth={2} />
                          )}
                        </View>
                      </View>
                      <View style={{
                        paddingHorizontal: spacing[2],
                        paddingVertical: spacing[1],
                        borderRadius: radius.sm,
                        backgroundColor: getStatusColor(status) + '20',
                      }}>
                        <Text style={{
                          fontSize: 11,
                          fontFamily: fonts.sans.bold,
                          color: getStatusColor(status),
                        }}>
                          {status}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

export default memo(HttpPanel);
