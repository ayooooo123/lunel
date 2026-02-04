// React hook to interface with EditorStore
// Only triggers re-renders when explicitly needed (tab changes, etc.)

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { editorStore, EditorStore, TabData } from './EditorStore';
import { SupportedLanguage, CursorPosition } from './types';

// Force update hook
function useForceUpdate() {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  return forceUpdate;
}

export function useEditorStore() {
  const forceUpdate = useForceUpdate();
  const storeRef = useRef(editorStore);

  // Subscribe to store notifications
  useEffect(() => {
    return storeRef.current.subscribe(forceUpdate);
  }, [forceUpdate]);

  // Tab operations (these notify and trigger re-render)
  const createTab = useCallback((fileName: string, language: SupportedLanguage, content?: string, filePath?: string | null) => {
    return storeRef.current.createTab(fileName, language, content, filePath ?? null);
  }, []);

  const openFile = useCallback((filePath: string, fileName: string, language: SupportedLanguage, content: string) => {
    return storeRef.current.openFile(filePath, fileName, language, content);
  }, []);

  const findTabByPath = useCallback((filePath: string) => {
    return storeRef.current.findTabByPath(filePath);
  }, []);

  const markSavedWithContent = useCallback((tabId: string, content: string) => {
    storeRef.current.markSavedWithContent(tabId, content);
  }, []);

  const closeTab = useCallback((tabId: string) => {
    storeRef.current.closeTab(tabId);
  }, []);

  const setActiveTab = useCallback((tabId: string) => {
    storeRef.current.setActiveTab(tabId);
  }, []);

  const renameTab = useCallback((tabId: string, fileName: string, language?: SupportedLanguage) => {
    storeRef.current.renameTab(tabId, fileName, language);
  }, []);

  const markSaved = useCallback((tabId: string) => {
    storeRef.current.markSaved(tabId);
  }, []);

  const markModified = useCallback((tabId: string) => {
    storeRef.current.markModified(tabId);
  }, []);

  // Content operations (these do NOT trigger re-render)
  const setContent = useCallback((tabId: string, content: string, pushUndo?: boolean) => {
    storeRef.current.setContent(tabId, content, pushUndo);
  }, []);

  const getContent = useCallback((tabId: string) => {
    return storeRef.current.getContent(tabId);
  }, []);

  const setCursorPosition = useCallback((tabId: string, position: CursorPosition) => {
    storeRef.current.setCursorPosition(tabId, position);
  }, []);

  const getCursorPosition = useCallback((tabId: string) => {
    return storeRef.current.getCursorPosition(tabId);
  }, []);

  // Undo/Redo
  const undo = useCallback((tabId: string) => {
    return storeRef.current.undo(tabId);
  }, []);

  const redo = useCallback((tabId: string) => {
    return storeRef.current.redo(tabId);
  }, []);

  const canUndo = useCallback((tabId: string) => {
    return storeRef.current.canUndo(tabId);
  }, []);

  const canRedo = useCallback((tabId: string) => {
    return storeRef.current.canRedo(tabId);
  }, []);

  const checkpoint = useCallback((tabId: string) => {
    storeRef.current.checkpoint(tabId);
  }, []);

  // Getters
  const getActiveTabId = useCallback(() => {
    return storeRef.current.getActiveTabId();
  }, []);

  const getTab = useCallback((tabId: string) => {
    return storeRef.current.getTab(tabId);
  }, []);

  const getActiveTab = useCallback(() => {
    return storeRef.current.getActiveTab();
  }, []);

  const getAllTabs = useCallback(() => {
    return storeRef.current.getAllTabs();
  }, []);

  return {
    // State (read on each render)
    activeTabId: storeRef.current.getActiveTabId(),
    tabs: storeRef.current.getAllTabs(),
    activeTab: storeRef.current.getActiveTab(),

    // Tab operations
    createTab,
    closeTab,
    setActiveTab,
    renameTab,
    markSaved,
    markModified,
    openFile,
    findTabByPath,
    markSavedWithContent,

    // Content operations (imperative, no re-render)
    setContent,
    getContent,
    setCursorPosition,
    getCursorPosition,

    // Undo/Redo
    undo,
    redo,
    canUndo,
    canRedo,
    checkpoint,

    // Getters
    getActiveTabId,
    getTab,
    getActiveTab,
    getAllTabs,

    // Direct store access for advanced use
    store: storeRef.current,
  };
}

export type { TabData };
