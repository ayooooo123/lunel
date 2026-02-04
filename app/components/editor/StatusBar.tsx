// VSCode-style Status Bar for Code Editor
import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, radius } from '@/constants/themes';
import { CursorPosition, SupportedLanguage, LANGUAGE_NAMES, EditorConfig } from './types';

interface StatusBarProps {
  colors: ThemeColors;
  cursorPosition: CursorPosition;
  language: SupportedLanguage;
  encoding: string;
  config: EditorConfig;
  onLanguagePress?: () => void;
  onEncodingPress?: () => void;
  onIndentPress?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

// Status bar item component
const StatusItem: React.FC<{
  label: string;
  colors: ThemeColors;
  onPress?: () => void;
  icon?: string;
}> = memo(({ label, colors, onPress, icon }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!onPress}
    style={styles.statusItem}
    activeOpacity={onPress ? 0.6 : 1}
  >
    {icon && (
      <Ionicons
        name={icon as any}
        size={12}
        color={colors.fg.muted}
        style={styles.statusIcon}
      />
    )}
    <Text style={[styles.statusText, { color: colors.fg.muted }]}>
      {label}
    </Text>
  </TouchableOpacity>
));

// Separator component - using subtle bg contrast instead of border
const Separator: React.FC<{ colors: ThemeColors }> = memo(({ colors }) => (
  <View style={[styles.separator, { backgroundColor: colors.bg.overlay }]} />
));

const StatusBar: React.FC<StatusBarProps> = memo(({
  colors,
  cursorPosition,
  language,
  encoding,
  config,
  onLanguagePress,
  onEncodingPress,
  onIndentPress,
  onZoomIn,
  onZoomOut,
}) => {
  // Format cursor position display
  const positionDisplay = `Ln ${cursorPosition.line + 1}, Col ${cursorPosition.column + 1}`;

  // Format indent display
  const indentDisplay = `Spaces: ${config.tabSize}`;

  // Get language display name
  const languageDisplay = LANGUAGE_NAMES[language] || language;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.raised }]}>
      {/* Left Section */}
      <View style={styles.leftSection}>
        {/* Cursor Position */}
        <StatusItem
          label={positionDisplay}
          colors={colors}
        />

        <Separator colors={colors} />

        {/* Selection Info (if any) */}
        {/* Could add selection count here */}
      </View>

      {/* Right Section */}
      <View style={styles.rightSection}>
        {/* Zoom Controls */}
        <TouchableOpacity
          onPress={onZoomOut}
          style={styles.zoomButton}
          activeOpacity={0.6}
        >
          <Ionicons
            name="remove"
            size={14}
            color={colors.fg.muted}
          />
        </TouchableOpacity>

        <Text style={[styles.fontSizeText, { color: colors.fg.muted }]}>
          {config.fontSize}px
        </Text>

        <TouchableOpacity
          onPress={onZoomIn}
          style={styles.zoomButton}
          activeOpacity={0.6}
        >
          <Ionicons
            name="add"
            size={14}
            color={colors.fg.muted}
          />
        </TouchableOpacity>

        <Separator colors={colors} />

        {/* Indent Settings */}
        <StatusItem
          label={indentDisplay}
          colors={colors}
          onPress={onIndentPress}
        />

        <Separator colors={colors} />

        {/* Encoding */}
        <StatusItem
          label={encoding}
          colors={colors}
          onPress={onEncodingPress}
        />

        <Separator colors={colors} />

        {/* Language */}
        <StatusItem
          label={languageDisplay}
          colors={colors}
          onPress={onLanguagePress}
          icon="code-slash"
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  separator: {
    width: 1,
    height: 14,
    marginHorizontal: 4,
  },
  zoomButton: {
    padding: 4,
    borderRadius: radius.sm,
  },
  fontSizeText: {
    fontSize: 11,
    fontWeight: '500',
    minWidth: 30,
    textAlign: 'center',
  },
});

export default StatusBar;
