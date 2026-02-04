// Editor Components Exports
export { default as CodeMirrorEditor } from './CodeMirrorEditor';
export { default as EditorTabs } from './EditorTabs';

// Legacy exports (can be removed once fully migrated)
export { default as CodeInput } from './CodeInput';
export { default as KeyboardToolbar } from './KeyboardToolbar';
export { default as SearchBar } from './SearchBar';
export { default as StatusBar } from './StatusBar';

// Store and hooks
export { editorStore, EditorStore } from './EditorStore';
export { useEditorStore } from './useEditorStore';
export type { TabData } from './EditorStore';
export type { CodeInputHandle } from './CodeInput';
export type { CodeMirrorEditorHandle } from './CodeMirrorEditor';

// Types and utilities
export * from './SyntaxHighlighter';
export * from './types';


