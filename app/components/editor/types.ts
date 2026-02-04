// Editor Types and Interfaces

export interface EditorTab {
  id: string;
  fileName: string;
  language: SupportedLanguage;
  content: string;
  isModified: boolean;
  cursorPosition: CursorPosition;
  scrollPosition: ScrollPosition;
}

export interface CursorPosition {
  line: number;
  column: number;
}

export interface ScrollPosition {
  x: number;
  y: number;
}

export interface Selection {
  start: CursorPosition;
  end: CursorPosition;
}

export type SupportedLanguage = 
  | 'javascript' 
  | 'typescript' 
  | 'jsx' 
  | 'tsx' 
  | 'json' 
  | 'html' 
  | 'css' 
  | 'python'
  | 'plaintext';

export interface ToolbarKey {
  label: string;
  value: string;
  icon?: string;
  width?: number;
}

export interface SearchState {
  isVisible: boolean;
  searchText: string;
  replaceText: string;
  matchCase: boolean;
  useRegex: boolean;
  matchWholeWord: boolean;
  currentMatch: number;
  totalMatches: number;
}

export interface UndoRedoState {
  undoStack: string[];
  redoStack: string[];
}

export interface FoldedRegion {
  startLine: number;
  endLine: number;
}

// Syntax highlighting token types
export type TokenType = 
  | 'keyword'
  | 'string'
  | 'comment'
  | 'function'
  | 'number'
  | 'operator'
  | 'variable'
  | 'type'
  | 'property'
  | 'punctuation'
  | 'default';

export interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
}

// Editor configuration
export interface EditorConfig {
  fontSize: number;
  tabSize: number;
  lineHeight: number;
  wordWrap: boolean;
  showLineNumbers: boolean;
  highlightCurrentLine: boolean;
}

export const DEFAULT_EDITOR_CONFIG: EditorConfig = {
  fontSize: 14,
  tabSize: 2,
  lineHeight: 1.4,
  wordWrap: true,
  showLineNumbers: true,
  highlightCurrentLine: true,
};

// Sample code for initial editor content
export const SAMPLE_CODE = `const greeting = "Hello, World!";

function sayHello(name) {
  console.log(\`\${greeting} \${name}!\`);
}

// Call the function
sayHello("Developer");
`;

// Language file extensions mapping
export const LANGUAGE_EXTENSIONS: Record<string, SupportedLanguage> = {
  '.js': 'javascript',
  '.jsx': 'jsx',
  '.ts': 'typescript',
  '.tsx': 'tsx',
  '.json': 'json',
  '.html': 'html',
  '.css': 'css',
  '.py': 'python',
  '.txt': 'plaintext',
};

// Language display names
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  jsx: 'JavaScript React',
  tsx: 'TypeScript React',
  json: 'JSON',
  html: 'HTML',
  css: 'CSS',
  python: 'Python',
  plaintext: 'Plain Text',
};

// Auto-pairing characters
export const AUTO_PAIRS: Record<string, string> = {
  '{': '}',
  '[': ']',
  '(': ')',
  '"': '"',
  "'": "'",
  '`': '`',
  '<': '>',
};

// Keyboard toolbar keys
export const TOOLBAR_KEYS: ToolbarKey[][] = [
  // Row 1 - Common brackets and operators
  [
    { label: 'TAB', value: '\t', width: 1.5 },
    { label: '{', value: '{' },
    { label: '}', value: '}' },
    { label: '[', value: '[' },
    { label: ']', value: ']' },
    { label: '(', value: '(' },
    { label: ')', value: ')' },
    { label: '<', value: '<' },
    { label: '>', value: '>' },
  ],
  // Row 2 - Quotes and special characters
  [
    { label: "'", value: "'" },
    { label: '"', value: '"' },
    { label: '`', value: '`' },
    { label: ';', value: ';' },
    { label: ':', value: ':' },
    { label: '=', value: '=' },
    { label: '=>', value: '=>' },
    { label: '|', value: '|' },
    { label: '&', value: '&' },
  ],
  // Row 3 - More operators and navigation
  [
    { label: '/', value: '/' },
    { label: '\\', value: '\\' },
    { label: '_', value: '_' },
    { label: '-', value: '-' },
    { label: '+', value: '+' },
    { label: '←', value: 'LEFT', icon: 'arrow-back' },
    { label: '↑', value: 'UP', icon: 'arrow-up' },
    { label: '↓', value: 'DOWN', icon: 'arrow-down' },
    { label: '→', value: 'RIGHT', icon: 'arrow-forward' },
  ],
];

// File icon mapping by extension
export const FILE_ICONS: Record<SupportedLanguage, string> = {
  javascript: 'logo-javascript',
  typescript: 'logo-javascript',
  jsx: 'logo-react',
  tsx: 'logo-react',
  json: 'document-text',
  html: 'logo-html5',
  css: 'logo-css3',
  python: 'logo-python',
  plaintext: 'document',
};


