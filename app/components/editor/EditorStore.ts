// EditorStore - Imperative state management for the code editor
// No React state, no automatic re-renders. Updates are explicit.

import { EditorTab, CursorPosition, SupportedLanguage } from './types';

export interface TabData {
  id: string;
  fileName: string;
  filePath: string | null; // Full path for saving, null for untitled files
  language: SupportedLanguage;
  content: string;
  originalContent: string; // Original content for change detection
  isModified: boolean;
  cursorPosition: CursorPosition;
  undoStack: string[];
  redoStack: string[];
  lastEditTime: number; // For undo batching
}

const UNDO_BATCH_DELAY = 500; // ms - group edits within this window
const MAX_UNDO_STACK = 100;

export class EditorStore {
  private tabs: Map<string, TabData> = new Map();
  private activeTabId: string | null = null;
  private listeners: Set<() => void> = new Set();

  // Subscribe to store changes (for forcing re-renders when needed)
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  // Tab Management
  createTab(fileName: string, language: SupportedLanguage, content: string = '', filePath: string | null = null): string {
    const id = Date.now().toString();
    this.tabs.set(id, {
      id,
      fileName,
      filePath,
      language,
      content,
      originalContent: content,
      isModified: false,
      cursorPosition: { line: 0, column: 0 },
      undoStack: [],
      redoStack: [],
      lastEditTime: 0,
    });
    this.activeTabId = id;
    this.notify();
    return id;
  }

  // Find tab by file path
  findTabByPath(filePath: string): TabData | undefined {
    for (const tab of this.tabs.values()) {
      if (tab.filePath === filePath) {
        return tab;
      }
    }
    return undefined;
  }

  // Open file - creates tab or switches to existing
  openFile(filePath: string, fileName: string, language: SupportedLanguage, content: string): string {
    // Check if file is already open
    const existingTab = this.findTabByPath(filePath);
    if (existingTab) {
      this.setActiveTab(existingTab.id);
      return existingTab.id;
    }
    // Create new tab
    return this.createTab(fileName, language, content, filePath);
  }

  // Update original content (after save)
  markSavedWithContent(tabId: string, content: string): void {
    const tab = this.tabs.get(tabId);
    if (tab) {
      tab.originalContent = content;
      tab.isModified = false;
      this.notify();
    }
  }

  closeTab(tabId: string): void {
    this.tabs.delete(tabId);
    if (this.activeTabId === tabId) {
      const remaining = Array.from(this.tabs.keys());
      this.activeTabId = remaining.length > 0 ? remaining[remaining.length - 1] : null;
    }
    this.notify();
  }

  setActiveTab(tabId: string): void {
    if (this.tabs.has(tabId) && this.activeTabId !== tabId) {
      this.activeTabId = tabId;
      this.notify();
    }
  }

  getActiveTabId(): string | null {
    return this.activeTabId;
  }

  getTab(tabId: string): TabData | undefined {
    return this.tabs.get(tabId);
  }

  getActiveTab(): TabData | undefined {
    return this.activeTabId ? this.tabs.get(this.activeTabId) : undefined;
  }

  getAllTabs(): TabData[] {
    return Array.from(this.tabs.values());
  }

  getTabCount(): number {
    return this.tabs.size;
  }

  // Content Management - These do NOT trigger re-renders
  setContent(tabId: string, content: string, pushUndo: boolean = true): void {
    const tab = this.tabs.get(tabId);
    if (!tab) return;

    if (pushUndo) {
      const now = Date.now();
      const shouldBatch = now - tab.lastEditTime < UNDO_BATCH_DELAY;

      if (!shouldBatch && tab.content !== content) {
        // Start new undo group
        tab.undoStack.push(tab.content);
        if (tab.undoStack.length > MAX_UNDO_STACK) {
          tab.undoStack.shift();
        }
        tab.redoStack = []; // Clear redo on new edit
      }
      tab.lastEditTime = now;
    }

    tab.content = content;
    tab.isModified = true;
  }

  getContent(tabId: string): string {
    return this.tabs.get(tabId)?.content ?? '';
  }

  // Cursor Management - No re-renders
  setCursorPosition(tabId: string, position: CursorPosition): void {
    const tab = this.tabs.get(tabId);
    if (tab) {
      tab.cursorPosition = position;
    }
  }

  getCursorPosition(tabId: string): CursorPosition {
    return this.tabs.get(tabId)?.cursorPosition ?? { line: 0, column: 0 };
  }

  // Undo/Redo
  undo(tabId: string): string | null {
    const tab = this.tabs.get(tabId);
    if (!tab || tab.undoStack.length === 0) return null;

    const previousContent = tab.undoStack.pop()!;
    tab.redoStack.push(tab.content);
    tab.content = previousContent;
    tab.lastEditTime = 0; // Reset batch timer
    return previousContent;
  }

  redo(tabId: string): string | null {
    const tab = this.tabs.get(tabId);
    if (!tab || tab.redoStack.length === 0) return null;

    const nextContent = tab.redoStack.pop()!;
    tab.undoStack.push(tab.content);
    tab.content = nextContent;
    tab.lastEditTime = 0;
    return nextContent;
  }

  canUndo(tabId: string): boolean {
    return (this.tabs.get(tabId)?.undoStack.length ?? 0) > 0;
  }

  canRedo(tabId: string): boolean {
    return (this.tabs.get(tabId)?.redoStack.length ?? 0) > 0;
  }

  // Force an undo checkpoint (call before paste, etc.)
  checkpoint(tabId: string): void {
    const tab = this.tabs.get(tabId);
    if (!tab) return;

    tab.undoStack.push(tab.content);
    if (tab.undoStack.length > MAX_UNDO_STACK) {
      tab.undoStack.shift();
    }
    tab.redoStack = [];
    tab.lastEditTime = 0;
  }

  // Mark tab as saved
  markSaved(tabId: string): void {
    const tab = this.tabs.get(tabId);
    if (tab) {
      tab.isModified = false;
      this.notify();
    }
  }

  // Mark tab as modified (dirty)
  markModified(tabId: string): void {
    const tab = this.tabs.get(tabId);
    if (tab && !tab.isModified) {
      tab.isModified = true;
      this.notify();
    }
  }

  // Rename tab
  renameTab(tabId: string, fileName: string, language?: SupportedLanguage): void {
    const tab = this.tabs.get(tabId);
    if (tab) {
      tab.fileName = fileName;
      if (language) tab.language = language;
      this.notify();
    }
  }
}

// Singleton instance
export const editorStore = new EditorStore();
