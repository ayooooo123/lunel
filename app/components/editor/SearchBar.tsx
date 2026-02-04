// Search and Replace Bar for Code Editor
import React, { memo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, radius } from '@/constants/themes';
import { SearchState } from './types';

interface SearchBarProps {
  colors: ThemeColors;
  isVisible: boolean;
  searchState: SearchState;
  onSearchChange: (text: string) => void;
  onReplaceChange: (text: string) => void;
  onFindNext: () => void;
  onFindPrevious: () => void;
  onReplace: () => void;
  onReplaceAll: () => void;
  onToggleMatchCase: () => void;
  onToggleRegex: () => void;
  onToggleWholeWord: () => void;
  onClose: () => void;
}

// Toggle button component
const ToggleButton: React.FC<{
  icon: string;
  label: string;
  active: boolean;
  colors: ThemeColors;
  onPress: () => void;
}> = memo(({ icon, label, active, colors, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.toggleButton,
      {
        backgroundColor: active ? colors.accent.default : 'transparent',
        borderColor: active ? colors.accent.default : colors.bg.overlay,
      },
    ]}
    activeOpacity={0.7}
  >
    <Text
      style={[
        styles.toggleLabel,
        { color: active ? colors.bg.base : colors.fg.muted },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
));

// Action button component
const ActionButton: React.FC<{
  icon: string;
  colors: ThemeColors;
  onPress: () => void;
  disabled?: boolean;
}> = memo(({ icon, colors, onPress, disabled }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[styles.actionButton, { opacity: disabled ? 0.4 : 1 }]}
    activeOpacity={0.6}
  >
    <Ionicons
      name={icon as any}
      size={18}
      color={colors.fg.default}
    />
  </TouchableOpacity>
));

const SearchBar: React.FC<SearchBarProps> = memo(({
  colors,
  isVisible,
  searchState,
  onSearchChange,
  onReplaceChange,
  onFindNext,
  onFindPrevious,
  onReplace,
  onReplaceAll,
  onToggleMatchCase,
  onToggleRegex,
  onToggleWholeWord,
  onClose,
}) => {
  const [showReplace, setShowReplace] = useState(false);

  if (!isVisible) return null;

  const hasMatches = searchState.totalMatches > 0;
  const matchDisplay = searchState.searchText
    ? `${searchState.currentMatch + 1} of ${searchState.totalMatches}`
    : 'No results';

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.raised, borderBottomColor: colors.bg.overlay }]}>
      {/* Search Row */}
      <View style={styles.row}>
        {/* Toggle Replace */}
        <TouchableOpacity
          onPress={() => setShowReplace(!showReplace)}
          style={styles.expandButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showReplace ? 'chevron-down' : 'chevron-forward'}
            size={16}
            color={colors.fg.muted}
          />
        </TouchableOpacity>

        {/* Search Input */}
        <View style={[styles.inputContainer, { backgroundColor: colors.bg.base, borderColor: colors.bg.overlay }]}>
          <Ionicons
            name="search"
            size={14}
            color={colors.fg.muted}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.input, { color: colors.fg.default }]}
            value={searchState.searchText}
            onChangeText={onSearchChange}
            placeholder="Search"
            placeholderTextColor={colors.fg.muted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={onFindNext}
          />
          {searchState.searchText.length > 0 && (
            <Text style={[styles.matchCount, { color: colors.fg.muted }]}>
              {matchDisplay}
            </Text>
          )}
        </View>

        {/* Search Options */}
        <View style={styles.options}>
          <ToggleButton
            icon="text"
            label="Aa"
            active={searchState.matchCase}
            colors={colors}
            onPress={onToggleMatchCase}
          />
          <ToggleButton
            icon="code"
            label=".*"
            active={searchState.useRegex}
            colors={colors}
            onPress={onToggleRegex}
          />
          <ToggleButton
            icon="text"
            label="[w]"
            active={searchState.matchWholeWord}
            colors={colors}
            onPress={onToggleWholeWord}
          />
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigation}>
          <ActionButton
            icon="chevron-up"
            colors={colors}
            onPress={onFindPrevious}
            disabled={!hasMatches}
          />
          <ActionButton
            icon="chevron-down"
            colors={colors}
            onPress={onFindNext}
            disabled={!hasMatches}
          />
        </View>

        {/* Close Button */}
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name="close"
            size={20}
            color={colors.fg.muted}
          />
        </TouchableOpacity>
      </View>

      {/* Replace Row */}
      {showReplace && (
        <View style={styles.row}>
          <View style={styles.expandButton} />
          
          {/* Replace Input */}
          <View style={[styles.inputContainer, { backgroundColor: colors.bg.base, borderColor: colors.bg.overlay }]}>
            <Ionicons
              name="swap-horizontal"
              size={14}
              color={colors.fg.muted}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.fg.default }]}
              value={searchState.replaceText}
              onChangeText={onReplaceChange}
              placeholder="Replace"
              placeholderTextColor={colors.fg.muted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Replace Actions */}
          <View style={styles.replaceActions}>
            <TouchableOpacity
              onPress={onReplace}
              disabled={!hasMatches}
              style={[
                styles.replaceButton,
                { 
                  backgroundColor: colors.bg.base,
                  borderColor: colors.bg.overlay,
                  opacity: hasMatches ? 1 : 0.4,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.replaceButtonText, { color: colors.fg.default }]}>
                Replace
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={onReplaceAll}
              disabled={!hasMatches}
              style={[
                styles.replaceButton,
                { 
                  backgroundColor: colors.accent.default,
                  borderColor: colors.accent.default,
                  opacity: hasMatches ? 1 : 0.4,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.replaceButtonText, { color: colors.bg.base }]}>
                All
              </Text>
            </TouchableOpacity>
          </View>

          {/* Spacer to align with close button */}
          <View style={styles.closeButton} />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  expandButton: {
    width: 24,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  matchCount: {
    fontSize: 11,
    marginLeft: 8,
  },
  options: {
    flexDirection: 'row',
    marginRight: 8,
  },
  toggleButton: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  navigation: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replaceActions: {
    flexDirection: 'row',
  },
  replaceButton: {
    paddingHorizontal: 12,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  replaceButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default SearchBar;


