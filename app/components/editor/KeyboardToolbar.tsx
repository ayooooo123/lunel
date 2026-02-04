// Custom Keyboard Toolbar for Code Editor
import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, radius } from '@/constants/themes';
import { TOOLBAR_KEYS, ToolbarKey } from './types';

interface KeyboardToolbarProps {
  colors: ThemeColors;
  onKeyPress: (key: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

// Single toolbar key button
const ToolbarButton: React.FC<{
  item: ToolbarKey;
  colors: ThemeColors;
  onPress: () => void;
}> = memo(({ item, colors, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.keyButton,
      {
        backgroundColor: colors.bg.raised,
        minWidth: item.width ? item.width * 44 : 44,
      },
    ]}
    activeOpacity={0.6}
  >
    {item.icon ? (
      <Ionicons
        name={item.icon as any}
        size={16}
        color={colors.fg.default}
      />
    ) : (
      <Text style={[styles.keyLabel, { color: colors.fg.default }]}>
        {item.label}
      </Text>
    )}
  </TouchableOpacity>
));

// Action button (Undo/Redo)
const ActionButton: React.FC<{
  icon: string;
  colors: ThemeColors;
  onPress: () => void;
  disabled: boolean;
}> = memo(({ icon, colors, onPress, disabled }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[
      styles.actionButton,
      {
        backgroundColor: colors.bg.raised,
        opacity: disabled ? 0.4 : 1,
      },
    ]}
    activeOpacity={0.6}
  >
    <Ionicons
      name={icon as any}
      size={18}
      color={colors.fg.default}
    />
  </TouchableOpacity>
));

const KeyboardToolbar: React.FC<KeyboardToolbarProps> = memo(({
  colors,
  onKeyPress,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  return (
    <View style={[styles.container, { backgroundColor: colors.bg.base }]}>
      {/* Main Keys ScrollView */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
      >
        {/* Row 1 - Brackets */}
        <View style={styles.keyGroup}>
          {TOOLBAR_KEYS[0].map((item, index) => (
            <ToolbarButton
              key={`row1-${index}`}
              item={item}
              colors={colors}
              onPress={() => onKeyPress(item.value)}
            />
          ))}
        </View>

        {/* Separator - using bg contrast */}
        <View style={[styles.separator, { backgroundColor: colors.bg.overlay }]} />

        {/* Row 2 - Quotes and symbols */}
        <View style={styles.keyGroup}>
          {TOOLBAR_KEYS[1].map((item, index) => (
            <ToolbarButton
              key={`row2-${index}`}
              item={item}
              colors={colors}
              onPress={() => onKeyPress(item.value)}
            />
          ))}
        </View>

        {/* Separator */}
        <View style={[styles.separator, { backgroundColor: colors.bg.overlay }]} />

        {/* Row 3 - Operators and arrows */}
        <View style={styles.keyGroup}>
          {TOOLBAR_KEYS[2].map((item, index) => (
            <ToolbarButton
              key={`row3-${index}`}
              item={item}
              colors={colors}
              onPress={() => onKeyPress(item.value)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Undo/Redo Actions */}
      <View style={styles.actions}>
        <ActionButton
          icon="arrow-undo"
          colors={colors}
          onPress={onUndo}
          disabled={!canUndo}
        />
        <ActionButton
          icon="arrow-redo"
          colors={colors}
          onPress={onRedo}
          disabled={!canRedo}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  keyGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    width: 1,
    height: 28,
    marginHorizontal: 6,
  },
  keyButton: {
    minWidth: 44,
    height: 40,
    marginHorizontal: 2,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  keyLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 4,
  },
  actionButton: {
    width: 40,
    height: 40,
    marginHorizontal: 2,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default KeyboardToolbar;
