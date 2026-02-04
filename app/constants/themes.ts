// Lunel Design System - Theme Tokens
// Based on DESIGN.md - "Depth Through Color, Not Lines"

export type ThemeId =
  | 'light'
  | 'dark'
  | 'nord-light'
  | 'nord-dark'
  | 'gruvbox-light'
  | 'gruvbox-dark'
  | 'tokyonight'
  | 'catppuccin'
  | 'one-dark-pro'
  | 'material-light'
  | 'material-dark'
  | 'material-darker'
  | 'material-palenight'
  | 'material-oceanic'
  | 'dracula'
  | 'horizon'
  | 'monokai'
  | 'synthwave-84'
  | 'github-dark'
  | 'github-light'
  | 'ayu-dark'
  | 'ayu-mirage'
  | 'ayu-light'
  | 'solarized-dark'
  | 'solarized-light'
  | 'rose-pine'
  | 'rose-pine-dawn'
  | 'everforest-dark'
  | 'everforest-light'
  | 'kanagawa'
  | 'night-owl'
  | 'vitesse-dark'
  | 'monochrome';
export type ThemeOption = 'device' | ThemeId;

// =============================================================================
// Typography
// =============================================================================

export interface ThemeFonts {
  sans: {
    regular: string;
    medium: string;
    semibold: string;
    bold: string;
  };
  mono: {
    regular: string;
    medium: string;
    bold: string;
  };
  display: string;
}

// Font family definitions - maps to expo-google-fonts names
export type NormalFamilyId =
  // Sans serif
  | 'inter' | 'roboto' | 'ibm-plex-sans' | 'source-sans' | 'dm-sans'
  // Serif
  | 'merriweather' | 'lora' | 'playfair-display' | 'ibm-plex-serif' | 'source-serif'
  // Monospace
  | 'jetbrains-mono' | 'fira-code' | 'source-code-pro' | 'ibm-plex-mono' | 'dm-mono';

export type MonoFamilyId = 'jetbrains-mono' | 'fira-code' | 'source-code-pro' | 'ibm-plex-mono' | 'dm-mono';
export type DisplayFamilyId = 'khand' | 'orbitron' | 'space-grotesk';

export interface NormalFamily {
  id: NormalFamilyId;
  name: string;
  regular: string;
  medium: string;
  semibold: string;
  bold: string;
}

export interface MonoFamily {
  id: MonoFamilyId;
  name: string;
  regular: string;
  medium: string;
  bold: string;
}

export interface DisplayFamily {
  id: DisplayFamilyId;
  name: string;
  font: string;
}

// Normal font families (sans, serif, and mono - all available for normal text)
export const normalFamilies: Record<NormalFamilyId, NormalFamily> = {
  // Sans serif
  'inter': {
    id: 'inter',
    name: 'Inter',
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  'roboto': {
    id: 'roboto',
    name: 'Roboto',
    regular: 'Roboto_400Regular',
    medium: 'Roboto_500Medium',
    semibold: 'Roboto_500Medium',
    bold: 'Roboto_700Bold',
  },
  'ibm-plex-sans': {
    id: 'ibm-plex-sans',
    name: 'IBM Plex Sans',
    regular: 'IBMPlexSans_400Regular',
    medium: 'IBMPlexSans_500Medium',
    semibold: 'IBMPlexSans_600SemiBold',
    bold: 'IBMPlexSans_700Bold',
  },
  'source-sans': {
    id: 'source-sans',
    name: 'Source Sans 3',
    regular: 'SourceSans3_400Regular',
    medium: 'SourceSans3_500Medium',
    semibold: 'SourceSans3_600SemiBold',
    bold: 'SourceSans3_700Bold',
  },
  'dm-sans': {
    id: 'dm-sans',
    name: 'DM Sans',
    regular: 'DMSans_400Regular',
    medium: 'DMSans_500Medium',
    semibold: 'DMSans_600SemiBold',
    bold: 'DMSans_700Bold',
  },
  // Serif
  'merriweather': {
    id: 'merriweather',
    name: 'Merriweather',
    regular: 'Merriweather_400Regular',
    medium: 'Merriweather_400Regular',
    semibold: 'Merriweather_700Bold',
    bold: 'Merriweather_900Black',
  },
  'lora': {
    id: 'lora',
    name: 'Lora',
    regular: 'Lora_400Regular',
    medium: 'Lora_500Medium',
    semibold: 'Lora_600SemiBold',
    bold: 'Lora_700Bold',
  },
  'playfair-display': {
    id: 'playfair-display',
    name: 'Playfair Display',
    regular: 'PlayfairDisplay_400Regular',
    medium: 'PlayfairDisplay_500Medium',
    semibold: 'PlayfairDisplay_600SemiBold',
    bold: 'PlayfairDisplay_700Bold',
  },
  'ibm-plex-serif': {
    id: 'ibm-plex-serif',
    name: 'IBM Plex Serif',
    regular: 'IBMPlexSerif_400Regular',
    medium: 'IBMPlexSerif_500Medium',
    semibold: 'IBMPlexSerif_600SemiBold',
    bold: 'IBMPlexSerif_700Bold',
  },
  'source-serif': {
    id: 'source-serif',
    name: 'Source Serif 4',
    regular: 'SourceSerif4_400Regular',
    medium: 'SourceSerif4_500Medium',
    semibold: 'SourceSerif4_600SemiBold',
    bold: 'SourceSerif4_700Bold',
  },
  // Monospace
  'jetbrains-mono': {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    regular: 'JetBrainsMono_400Regular',
    medium: 'JetBrainsMono_500Medium',
    semibold: 'JetBrainsMono_500Medium',
    bold: 'JetBrainsMono_700Bold',
  },
  'fira-code': {
    id: 'fira-code',
    name: 'Fira Code',
    regular: 'FiraCode_400Regular',
    medium: 'FiraCode_500Medium',
    semibold: 'FiraCode_500Medium',
    bold: 'FiraCode_700Bold',
  },
  'source-code-pro': {
    id: 'source-code-pro',
    name: 'Source Code Pro',
    regular: 'SourceCodePro_400Regular',
    medium: 'SourceCodePro_500Medium',
    semibold: 'SourceCodePro_500Medium',
    bold: 'SourceCodePro_700Bold',
  },
  'ibm-plex-mono': {
    id: 'ibm-plex-mono',
    name: 'IBM Plex Mono',
    regular: 'IBMPlexMono_400Regular',
    medium: 'IBMPlexMono_500Medium',
    semibold: 'IBMPlexMono_500Medium',
    bold: 'IBMPlexMono_700Bold',
  },
  'dm-mono': {
    id: 'dm-mono',
    name: 'DM Mono',
    regular: 'DMMono_400Regular',
    medium: 'DMMono_500Medium',
    semibold: 'DMMono_500Medium',
    bold: 'DMMono_500Medium',
  },
};

// Monospace font families (for code)
export const monoFamilies: Record<MonoFamilyId, MonoFamily> = {
  'jetbrains-mono': {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    regular: 'JetBrainsMono_400Regular',
    medium: 'JetBrainsMono_500Medium',
    bold: 'JetBrainsMono_700Bold',
  },
  'fira-code': {
    id: 'fira-code',
    name: 'Fira Code',
    regular: 'FiraCode_400Regular',
    medium: 'FiraCode_500Medium',
    bold: 'FiraCode_700Bold',
  },
  'source-code-pro': {
    id: 'source-code-pro',
    name: 'Source Code Pro',
    regular: 'SourceCodePro_400Regular',
    medium: 'SourceCodePro_500Medium',
    bold: 'SourceCodePro_700Bold',
  },
  'ibm-plex-mono': {
    id: 'ibm-plex-mono',
    name: 'IBM Plex Mono',
    regular: 'IBMPlexMono_400Regular',
    medium: 'IBMPlexMono_500Medium',
    bold: 'IBMPlexMono_700Bold',
  },
  'dm-mono': {
    id: 'dm-mono',
    name: 'DM Mono',
    regular: 'DMMono_400Regular',
    medium: 'DMMono_500Medium',
    bold: 'DMMono_500Medium', // DM Mono doesn't have bold, use medium
  },
};

// Display font families
export const displayFamilies: Record<DisplayFamilyId, DisplayFamily> = {
  'khand': {
    id: 'khand',
    name: 'Khand',
    font: 'Khand_600SemiBold',
  },
  'orbitron': {
    id: 'orbitron',
    name: 'Orbitron',
    font: 'Orbitron_700Bold',
  },
  'space-grotesk': {
    id: 'space-grotesk',
    name: 'Space Grotesk',
    font: 'SpaceGrotesk_700Bold',
  },
};

// Font selection state
export interface FontSelection {
  normal: NormalFamilyId;
  mono: MonoFamilyId;
  display: DisplayFamilyId;
}

export const DEFAULT_FONT_SELECTION: FontSelection = {
  normal: 'inter',
  mono: 'jetbrains-mono',
  display: 'khand',
};

// Helper to build ThemeFonts from selection
export function buildFonts(selection: FontSelection): ThemeFonts {
  const normal = normalFamilies[selection.normal];
  const mono = monoFamilies[selection.mono];
  const display = displayFamilies[selection.display];

  return {
    sans: {
      regular: normal.regular,
      medium: normal.medium,
      semibold: normal.semibold,
      bold: normal.bold,
    },
    mono: {
      regular: mono.regular,
      medium: mono.medium,
      bold: mono.bold,
    },
    display: display.font,
  };
}

// Default fonts (using default selection)
export const fonts: ThemeFonts = buildFonts(DEFAULT_FONT_SELECTION);

export interface ThemeTypography {
  xs: number;
  sm: number;
  base: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
}

export const typography: ThemeTypography = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
};

// =============================================================================
// Spacing (4px base grid)
// =============================================================================

export interface ThemeSpacing {
  0: number;
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
  6: number;
  7: number;
  8: number;
}

export const spacing: ThemeSpacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
  7: 48,
  8: 64,
};

// =============================================================================
// Radius
// =============================================================================

export interface ThemeRadius {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export const radius: ThemeRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// =============================================================================
// Color System
// =============================================================================

export interface ThemeColors {
  // Background layers (depth through color)
  bg: {
    base: string;       // Page canvas
    raised: string;     // Cards, inputs, sidebars
    overlay: string;    // Modals, sheets
    elevated: string;   // Tooltips, dropdowns
  };

  // Foreground/text (use opacity for hierarchy)
  fg: {
    default: string;    // 100% - Primary text
    muted: string;      // 60% - Secondary text
    subtle: string;     // 40% - Tertiary text
    disabled: string;   // 25% - Disabled text
  };

  // Accent color (used sparingly)
  accent: {
    default: string;    // Primary actions
    hover: string;      // Hover state
    active: string;     // Pressed state
    subtle: string;     // 10% opacity bg
    fg: string;         // Text on accent bg
  };

  // Status colors
  status: {
    success: string;
    successSubtle: string;
    warning: string;
    warningSubtle: string;
    error: string;
    errorSubtle: string;
    info: string;
    infoSubtle: string;
  };

  // Editor specific
  editor: {
    bg: string;
    fg: string;
    lineNumber: string;
    lineNumberActive: string;
    lineHighlight: string;
    selection: string;
    cursor: string;
    matchingBracket: string;
    findMatch: string;
  };

  // Syntax highlighting
  syntax: {
    keyword: string;
    string: string;
    number: string;
    boolean: string;
    comment: string;
    function: string;
    variable: string;
    parameter: string;
    property: string;
    operator: string;
    punctuation: string;
    class: string;
    type: string;
    constant: string;
    tag: string;
    attribute: string;
    regex: string;
    inserted: string;
    deleted: string;
  };

  // Terminal colors
  terminal: {
    bg: string;
    fg: string;
    cursor: string;
    selection: string;
    black: string;
    red: string;
    green: string;
    yellow: string;
    blue: string;
    magenta: string;
    cyan: string;
    white: string;
    brightBlack: string;
    brightRed: string;
    brightGreen: string;
    brightYellow: string;
    brightBlue: string;
    brightMagenta: string;
    brightCyan: string;
    brightWhite: string;
  };
}

// =============================================================================
// Theme Definitions
// =============================================================================

const lightTheme: ThemeColors = {
  bg: {
    base: '#ffffff',
    raised: '#f7f7f7',
    overlay: '#f0f0f0',
    elevated: '#e8e8e8',
  },
  fg: {
    default: '#0a0a0a',
    muted: '#666666',
    subtle: '#999999',
    disabled: '#bbbbbb',
  },
  accent: {
    default: '#6366f1',
    hover: '#4f46e5',
    active: '#4338ca',
    subtle: '#6366f115',
    fg: '#ffffff',
  },
  status: {
    success: '#22c55e',
    successSubtle: '#22c55e15',
    warning: '#f59e0b',
    warningSubtle: '#f59e0b15',
    error: '#ef4444',
    errorSubtle: '#ef444415',
    info: '#3b82f6',
    infoSubtle: '#3b82f615',
  },
  editor: {
    bg: '#ffffff',
    fg: '#0a0a0a',
    lineNumber: '#999999',
    lineNumberActive: '#0a0a0a',
    lineHighlight: '#f7f7f7',
    selection: '#6366f130',
    cursor: '#0a0a0a',
    matchingBracket: '#6366f130',
    findMatch: '#fbbf2480',
  },
  syntax: {
    keyword: '#7c3aed',
    string: '#16a34a',
    number: '#0891b2',
    boolean: '#7c3aed',
    comment: '#999999',
    function: '#2563eb',
    variable: '#0a0a0a',
    parameter: '#c2410c',
    property: '#0369a1',
    operator: '#0a0a0a',
    punctuation: '#666666',
    class: '#0891b2',
    type: '#0891b2',
    constant: '#c2410c',
    tag: '#dc2626',
    attribute: '#c2410c',
    regex: '#c2410c',
    inserted: '#16a34a',
    deleted: '#dc2626',
  },
  terminal: {
    bg: '#ffffff',
    fg: '#0a0a0a',
    cursor: '#0a0a0a',
    selection: '#6366f130',
    black: '#0a0a0a',
    red: '#dc2626',
    green: '#16a34a',
    yellow: '#ca8a04',
    blue: '#2563eb',
    magenta: '#9333ea',
    cyan: '#0891b2',
    white: '#f0f0f0',
    brightBlack: '#666666',
    brightRed: '#ef4444',
    brightGreen: '#22c55e',
    brightYellow: '#eab308',
    brightBlue: '#3b82f6',
    brightMagenta: '#a855f7',
    brightCyan: '#06b6d4',
    brightWhite: '#ffffff',
  },
};

const darkTheme: ThemeColors = {
  bg: {
    base: '#0a0a0a',
    raised: '#141414',
    overlay: '#1a1a1a',
    elevated: '#242424',
  },
  fg: {
    default: '#fafafa',
    muted: '#a0a0a0',
    subtle: '#707070',
    disabled: '#505050',
  },
  accent: {
    default: '#818cf8',
    hover: '#6366f1',
    active: '#4f46e5',
    subtle: '#818cf815',
    fg: '#0a0a0a',
  },
  status: {
    success: '#4ade80',
    successSubtle: '#4ade8015',
    warning: '#fbbf24',
    warningSubtle: '#fbbf2415',
    error: '#f87171',
    errorSubtle: '#f8717115',
    info: '#60a5fa',
    infoSubtle: '#60a5fa15',
  },
  editor: {
    bg: '#0a0a0a',
    fg: '#d4d4d4',
    lineNumber: '#505050',
    lineNumberActive: '#a0a0a0',
    lineHighlight: '#141414',
    selection: '#818cf830',
    cursor: '#fafafa',
    matchingBracket: '#818cf830',
    findMatch: '#fbbf2450',
  },
  syntax: {
    keyword: '#b392f0',
    string: '#e8a87c',
    number: '#79dfc1',
    boolean: '#b392f0',
    comment: '#6b737c',
    function: '#79b8ff',
    variable: '#e1e4e8',
    parameter: '#ffab70',
    property: '#79b8ff',
    operator: '#e1e4e8',
    punctuation: '#8b949e',
    class: '#f2cc60',
    type: '#79dfc1',
    constant: '#79dfc1',
    tag: '#f97583',
    attribute: '#ffab70',
    regex: '#dbedff',
    inserted: '#85e89d',
    deleted: '#f97583',
  },
  terminal: {
    bg: '#0a0a0a',
    fg: '#d4d4d4',
    cursor: '#fafafa',
    selection: '#818cf830',
    black: '#0a0a0a',
    red: '#f07178',
    green: '#a5d6a7',
    yellow: '#ffcb6b',
    blue: '#82aaff',
    magenta: '#c792ea',
    cyan: '#89ddff',
    white: '#d4d4d4',
    brightBlack: '#545454',
    brightRed: '#ff8a80',
    brightGreen: '#b9f6ca',
    brightYellow: '#ffe57f',
    brightBlue: '#80d8ff',
    brightMagenta: '#ea80fc',
    brightCyan: '#a7ffeb',
    brightWhite: '#fafafa',
  },
};

const nordLightTheme: ThemeColors = {
  bg: {
    base: '#eceff4',
    raised: '#e5e9f0',
    overlay: '#d8dee9',
    elevated: '#cdd3de',
  },
  fg: {
    default: '#2e3440',
    muted: '#4c566a',
    subtle: '#7b88a1',
    disabled: '#9aa5b9',
  },
  accent: {
    default: '#5e81ac',
    hover: '#5279a3',
    active: '#4c7096',
    subtle: '#5e81ac15',
    fg: '#ffffff',
  },
  status: {
    success: '#a3be8c',
    successSubtle: '#a3be8c20',
    warning: '#ebcb8b',
    warningSubtle: '#ebcb8b20',
    error: '#bf616a',
    errorSubtle: '#bf616a20',
    info: '#81a1c1',
    infoSubtle: '#81a1c120',
  },
  editor: {
    bg: '#eceff4',
    fg: '#2e3440',
    lineNumber: '#7b88a1',
    lineNumberActive: '#2e3440',
    lineHighlight: '#e5e9f0',
    selection: '#5e81ac30',
    cursor: '#2e3440',
    matchingBracket: '#5e81ac30',
    findMatch: '#ebcb8b60',
  },
  syntax: {
    keyword: '#5e81ac',
    string: '#a3be8c',
    number: '#b48ead',
    boolean: '#5e81ac',
    comment: '#7b88a1',
    function: '#88c0d0',
    variable: '#2e3440',
    parameter: '#d08770',
    property: '#81a1c1',
    operator: '#5e81ac',
    punctuation: '#4c566a',
    class: '#8fbcbb',
    type: '#8fbcbb',
    constant: '#b48ead',
    tag: '#bf616a',
    attribute: '#d08770',
    regex: '#ebcb8b',
    inserted: '#a3be8c',
    deleted: '#bf616a',
  },
  terminal: {
    bg: '#eceff4',
    fg: '#2e3440',
    cursor: '#2e3440',
    selection: '#5e81ac30',
    black: '#3b4252',
    red: '#bf616a',
    green: '#a3be8c',
    yellow: '#ebcb8b',
    blue: '#81a1c1',
    magenta: '#b48ead',
    cyan: '#88c0d0',
    white: '#e5e9f0',
    brightBlack: '#4c566a',
    brightRed: '#bf616a',
    brightGreen: '#a3be8c',
    brightYellow: '#ebcb8b',
    brightBlue: '#81a1c1',
    brightMagenta: '#b48ead',
    brightCyan: '#8fbcbb',
    brightWhite: '#eceff4',
  },
};

const nordDarkTheme: ThemeColors = {
  bg: {
    base: '#2e3440',
    raised: '#3b4252',
    overlay: '#434c5e',
    elevated: '#4c566a',
  },
  fg: {
    default: '#eceff4',
    muted: '#d8dee9',
    subtle: '#8f9aab',
    disabled: '#616e88',
  },
  accent: {
    default: '#88c0d0',
    hover: '#7eb8c9',
    active: '#6fb0c2',
    subtle: '#88c0d015',
    fg: '#2e3440',
  },
  status: {
    success: '#a3be8c',
    successSubtle: '#a3be8c20',
    warning: '#ebcb8b',
    warningSubtle: '#ebcb8b20',
    error: '#bf616a',
    errorSubtle: '#bf616a20',
    info: '#81a1c1',
    infoSubtle: '#81a1c120',
  },
  editor: {
    bg: '#2e3440',
    fg: '#d8dee9',
    lineNumber: '#616e88',
    lineNumberActive: '#d8dee9',
    lineHighlight: '#3b4252',
    selection: '#88c0d030',
    cursor: '#d8dee9',
    matchingBracket: '#88c0d030',
    findMatch: '#ebcb8b40',
  },
  syntax: {
    keyword: '#81a1c1',
    string: '#a3be8c',
    number: '#b48ead',
    boolean: '#81a1c1',
    comment: '#616e88',
    function: '#88c0d0',
    variable: '#d8dee9',
    parameter: '#d8dee9',
    property: '#8fbcbb',
    operator: '#81a1c1',
    punctuation: '#eceff4',
    class: '#8fbcbb',
    type: '#8fbcbb',
    constant: '#b48ead',
    tag: '#81a1c1',
    attribute: '#8fbcbb',
    regex: '#ebcb8b',
    inserted: '#a3be8c',
    deleted: '#bf616a',
  },
  terminal: {
    bg: '#2e3440',
    fg: '#d8dee9',
    cursor: '#d8dee9',
    selection: '#88c0d030',
    black: '#3b4252',
    red: '#bf616a',
    green: '#a3be8c',
    yellow: '#ebcb8b',
    blue: '#81a1c1',
    magenta: '#b48ead',
    cyan: '#88c0d0',
    white: '#e5e9f0',
    brightBlack: '#4c566a',
    brightRed: '#bf616a',
    brightGreen: '#a3be8c',
    brightYellow: '#ebcb8b',
    brightBlue: '#81a1c1',
    brightMagenta: '#b48ead',
    brightCyan: '#8fbcbb',
    brightWhite: '#eceff4',
  },
};

const gruvboxLightTheme: ThemeColors = {
  bg: {
    base: '#fbf1c7',
    raised: '#f2e5bc',
    overlay: '#ebdbb2',
    elevated: '#d5c4a1',
  },
  fg: {
    default: '#3c3836',
    muted: '#665c54',
    subtle: '#928374',
    disabled: '#a89984',
  },
  accent: {
    default: '#458588',
    hover: '#3d7679',
    active: '#35676a',
    subtle: '#45858815',
    fg: '#fbf1c7',
  },
  status: {
    success: '#98971a',
    successSubtle: '#98971a20',
    warning: '#d79921',
    warningSubtle: '#d7992120',
    error: '#cc241d',
    errorSubtle: '#cc241d20',
    info: '#458588',
    infoSubtle: '#45858820',
  },
  editor: {
    bg: '#fbf1c7',
    fg: '#3c3836',
    lineNumber: '#928374',
    lineNumberActive: '#3c3836',
    lineHighlight: '#f2e5bc',
    selection: '#45858830',
    cursor: '#3c3836',
    matchingBracket: '#45858830',
    findMatch: '#fabd2f60',
  },
  syntax: {
    keyword: '#9d0006',
    string: '#79740e',
    number: '#8f3f71',
    boolean: '#9d0006',
    comment: '#928374',
    function: '#79740e',
    variable: '#3c3836',
    parameter: '#b57614',
    property: '#076678',
    operator: '#3c3836',
    punctuation: '#3c3836',
    class: '#b57614',
    type: '#b57614',
    constant: '#8f3f71',
    tag: '#9d0006',
    attribute: '#b57614',
    regex: '#af3a03',
    inserted: '#79740e',
    deleted: '#9d0006',
  },
  terminal: {
    bg: '#fbf1c7',
    fg: '#3c3836',
    cursor: '#3c3836',
    selection: '#45858830',
    black: '#282828',
    red: '#cc241d',
    green: '#98971a',
    yellow: '#d79921',
    blue: '#458588',
    magenta: '#b16286',
    cyan: '#689d6a',
    white: '#a89984',
    brightBlack: '#928374',
    brightRed: '#9d0006',
    brightGreen: '#79740e',
    brightYellow: '#b57614',
    brightBlue: '#076678',
    brightMagenta: '#8f3f71',
    brightCyan: '#427b58',
    brightWhite: '#3c3836',
  },
};

const gruvboxDarkTheme: ThemeColors = {
  bg: {
    base: '#282828',
    raised: '#3c3836',
    overlay: '#504945',
    elevated: '#665c54',
  },
  fg: {
    default: '#ebdbb2',
    muted: '#bdae93',
    subtle: '#a89984',
    disabled: '#7c6f64',
  },
  accent: {
    default: '#83a598',
    hover: '#76988b',
    active: '#698b7e',
    subtle: '#83a59815',
    fg: '#282828',
  },
  status: {
    success: '#b8bb26',
    successSubtle: '#b8bb2620',
    warning: '#fabd2f',
    warningSubtle: '#fabd2f20',
    error: '#fb4934',
    errorSubtle: '#fb493420',
    info: '#83a598',
    infoSubtle: '#83a59820',
  },
  editor: {
    bg: '#282828',
    fg: '#ebdbb2',
    lineNumber: '#7c6f64',
    lineNumberActive: '#ebdbb2',
    lineHighlight: '#3c3836',
    selection: '#83a59830',
    cursor: '#ebdbb2',
    matchingBracket: '#83a59830',
    findMatch: '#fabd2f40',
  },
  syntax: {
    keyword: '#fb4934',
    string: '#b8bb26',
    number: '#d3869b',
    boolean: '#fb4934',
    comment: '#928374',
    function: '#b8bb26',
    variable: '#ebdbb2',
    parameter: '#fe8019',
    property: '#83a598',
    operator: '#ebdbb2',
    punctuation: '#ebdbb2',
    class: '#fabd2f',
    type: '#fabd2f',
    constant: '#d3869b',
    tag: '#fb4934',
    attribute: '#fabd2f',
    regex: '#fe8019',
    inserted: '#b8bb26',
    deleted: '#fb4934',
  },
  terminal: {
    bg: '#282828',
    fg: '#ebdbb2',
    cursor: '#ebdbb2',
    selection: '#83a59830',
    black: '#282828',
    red: '#cc241d',
    green: '#98971a',
    yellow: '#d79921',
    blue: '#458588',
    magenta: '#b16286',
    cyan: '#689d6a',
    white: '#a89984',
    brightBlack: '#928374',
    brightRed: '#fb4934',
    brightGreen: '#b8bb26',
    brightYellow: '#fabd2f',
    brightBlue: '#83a598',
    brightMagenta: '#d3869b',
    brightCyan: '#8ec07c',
    brightWhite: '#ebdbb2',
  },
};

const tokyonightTheme: ThemeColors = {
  bg: {
    base: '#1a1b26',
    raised: '#24283b',
    overlay: '#292e42',
    elevated: '#343b58',
  },
  fg: {
    default: '#c0caf5',
    muted: '#a9b1d6',
    subtle: '#565f89',
    disabled: '#414868',
  },
  accent: {
    default: '#7aa2f7',
    hover: '#6d95e8',
    active: '#5f88d9',
    subtle: '#7aa2f715',
    fg: '#1a1b26',
  },
  status: {
    success: '#9ece6a',
    successSubtle: '#9ece6a20',
    warning: '#e0af68',
    warningSubtle: '#e0af6820',
    error: '#f7768e',
    errorSubtle: '#f7768e20',
    info: '#7dcfff',
    infoSubtle: '#7dcfff20',
  },
  editor: {
    bg: '#1a1b26',
    fg: '#a9b1d6',
    lineNumber: '#3b4261',
    lineNumberActive: '#a9b1d6',
    lineHighlight: '#24283b',
    selection: '#7aa2f730',
    cursor: '#c0caf5',
    matchingBracket: '#7aa2f730',
    findMatch: '#e0af6840',
  },
  syntax: {
    keyword: '#bb9af7',
    string: '#9ece6a',
    number: '#ff9e64',
    boolean: '#ff9e64',
    comment: '#565f89',
    function: '#7aa2f7',
    variable: '#c0caf5',
    parameter: '#e0af68',
    property: '#73daca',
    operator: '#89ddff',
    punctuation: '#c0caf5',
    class: '#ff9e64',
    type: '#2ac3de',
    constant: '#ff9e64',
    tag: '#f7768e',
    attribute: '#bb9af7',
    regex: '#b4f9f8',
    inserted: '#9ece6a',
    deleted: '#f7768e',
  },
  terminal: {
    bg: '#1a1b26',
    fg: '#c0caf5',
    cursor: '#c0caf5',
    selection: '#7aa2f730',
    black: '#15161e',
    red: '#f7768e',
    green: '#9ece6a',
    yellow: '#e0af68',
    blue: '#7aa2f7',
    magenta: '#bb9af7',
    cyan: '#7dcfff',
    white: '#a9b1d6',
    brightBlack: '#414868',
    brightRed: '#f7768e',
    brightGreen: '#9ece6a',
    brightYellow: '#e0af68',
    brightBlue: '#7aa2f7',
    brightMagenta: '#bb9af7',
    brightCyan: '#7dcfff',
    brightWhite: '#c0caf5',
  },
};

// Catppuccin Mocha
const catppuccinTheme: ThemeColors = {
  bg: {
    base: '#1e1e2e',
    raised: '#313244',
    overlay: '#45475a',
    elevated: '#585b70',
  },
  fg: {
    default: '#cdd6f4',
    muted: '#bac2de',
    subtle: '#6c7086',
    disabled: '#45475a',
  },
  accent: {
    default: '#cba6f7',
    hover: '#b794f4',
    active: '#a082e0',
    subtle: '#cba6f715',
    fg: '#1e1e2e',
  },
  status: {
    success: '#a6e3a1',
    successSubtle: '#a6e3a120',
    warning: '#f9e2af',
    warningSubtle: '#f9e2af20',
    error: '#f38ba8',
    errorSubtle: '#f38ba820',
    info: '#89dceb',
    infoSubtle: '#89dceb20',
  },
  editor: {
    bg: '#1e1e2e',
    fg: '#cdd6f4',
    lineNumber: '#6c7086',
    lineNumberActive: '#cdd6f4',
    lineHighlight: '#313244',
    selection: '#cba6f730',
    cursor: '#f5e0dc',
    matchingBracket: '#cba6f730',
    findMatch: '#f9e2af40',
  },
  syntax: {
    keyword: '#cba6f7',
    string: '#a6e3a1',
    number: '#fab387',
    boolean: '#fab387',
    comment: '#6c7086',
    function: '#89b4fa',
    variable: '#cdd6f4',
    parameter: '#eba0ac',
    property: '#89dceb',
    operator: '#94e2d5',
    punctuation: '#bac2de',
    class: '#f9e2af',
    type: '#f9e2af',
    constant: '#fab387',
    tag: '#f38ba8',
    attribute: '#cba6f7',
    regex: '#f5c2e7',
    inserted: '#a6e3a1',
    deleted: '#f38ba8',
  },
  terminal: {
    bg: '#1e1e2e',
    fg: '#cdd6f4',
    cursor: '#f5e0dc',
    selection: '#cba6f730',
    black: '#45475a',
    red: '#f38ba8',
    green: '#a6e3a1',
    yellow: '#f9e2af',
    blue: '#89b4fa',
    magenta: '#f5c2e7',
    cyan: '#94e2d5',
    white: '#bac2de',
    brightBlack: '#585b70',
    brightRed: '#f38ba8',
    brightGreen: '#a6e3a1',
    brightYellow: '#f9e2af',
    brightBlue: '#89b4fa',
    brightMagenta: '#f5c2e7',
    brightCyan: '#94e2d5',
    brightWhite: '#a6adc8',
  },
};

// One Dark Pro
const oneDarkProTheme: ThemeColors = {
  bg: {
    base: '#282c34',
    raised: '#21252b',
    overlay: '#2c313a',
    elevated: '#3e4451',
  },
  fg: {
    default: '#abb2bf',
    muted: '#828997',
    subtle: '#5c6370',
    disabled: '#4b5263',
  },
  accent: {
    default: '#61afef',
    hover: '#519fdf',
    active: '#418fcf',
    subtle: '#61afef15',
    fg: '#282c34',
  },
  status: {
    success: '#98c379',
    successSubtle: '#98c37920',
    warning: '#e5c07b',
    warningSubtle: '#e5c07b20',
    error: '#e06c75',
    errorSubtle: '#e06c7520',
    info: '#56b6c2',
    infoSubtle: '#56b6c220',
  },
  editor: {
    bg: '#282c34',
    fg: '#abb2bf',
    lineNumber: '#4b5263',
    lineNumberActive: '#abb2bf',
    lineHighlight: '#2c313a',
    selection: '#3e4451',
    cursor: '#528bff',
    matchingBracket: '#61afef40',
    findMatch: '#e5c07b40',
  },
  syntax: {
    keyword: '#c678dd',
    string: '#98c379',
    number: '#d19a66',
    boolean: '#d19a66',
    comment: '#5c6370',
    function: '#61afef',
    variable: '#e06c75',
    parameter: '#abb2bf',
    property: '#e06c75',
    operator: '#56b6c2',
    punctuation: '#abb2bf',
    class: '#e5c07b',
    type: '#e5c07b',
    constant: '#d19a66',
    tag: '#e06c75',
    attribute: '#d19a66',
    regex: '#56b6c2',
    inserted: '#98c379',
    deleted: '#e06c75',
  },
  terminal: {
    bg: '#282c34',
    fg: '#abb2bf',
    cursor: '#528bff',
    selection: '#3e4451',
    black: '#282c34',
    red: '#e06c75',
    green: '#98c379',
    yellow: '#e5c07b',
    blue: '#61afef',
    magenta: '#c678dd',
    cyan: '#56b6c2',
    white: '#abb2bf',
    brightBlack: '#5c6370',
    brightRed: '#e06c75',
    brightGreen: '#98c379',
    brightYellow: '#e5c07b',
    brightBlue: '#61afef',
    brightMagenta: '#c678dd',
    brightCyan: '#56b6c2',
    brightWhite: '#ffffff',
  },
};

// Material Light
const materialLightTheme: ThemeColors = {
  bg: {
    base: '#fafafa',
    raised: '#ffffff',
    overlay: '#eeeeee',
    elevated: '#e0e0e0',
  },
  fg: {
    default: '#212121',
    muted: '#616161',
    subtle: '#9e9e9e',
    disabled: '#bdbdbd',
  },
  accent: {
    default: '#6182b8',
    hover: '#5171a5',
    active: '#416092',
    subtle: '#6182b815',
    fg: '#ffffff',
  },
  status: {
    success: '#91b859',
    successSubtle: '#91b85920',
    warning: '#f6a434',
    warningSubtle: '#f6a43420',
    error: '#e53935',
    errorSubtle: '#e5393520',
    info: '#6182b8',
    infoSubtle: '#6182b820',
  },
  editor: {
    bg: '#fafafa',
    fg: '#212121',
    lineNumber: '#9e9e9e',
    lineNumberActive: '#212121',
    lineHighlight: '#eeeeee',
    selection: '#6182b830',
    cursor: '#212121',
    matchingBracket: '#6182b830',
    findMatch: '#f6a43460',
  },
  syntax: {
    keyword: '#7c4dff',
    string: '#91b859',
    number: '#f76d47',
    boolean: '#7c4dff',
    comment: '#9e9e9e',
    function: '#6182b8',
    variable: '#212121',
    parameter: '#f6a434',
    property: '#39adb5',
    operator: '#39adb5',
    punctuation: '#39adb5',
    class: '#f6a434',
    type: '#f6a434',
    constant: '#f76d47',
    tag: '#e53935',
    attribute: '#f6a434',
    regex: '#91b859',
    inserted: '#91b859',
    deleted: '#e53935',
  },
  terminal: {
    bg: '#fafafa',
    fg: '#212121',
    cursor: '#212121',
    selection: '#6182b830',
    black: '#212121',
    red: '#e53935',
    green: '#91b859',
    yellow: '#f6a434',
    blue: '#6182b8',
    magenta: '#7c4dff',
    cyan: '#39adb5',
    white: '#fafafa',
    brightBlack: '#616161',
    brightRed: '#e53935',
    brightGreen: '#91b859',
    brightYellow: '#ffb62c',
    brightBlue: '#6182b8',
    brightMagenta: '#7c4dff',
    brightCyan: '#39adb5',
    brightWhite: '#ffffff',
  },
};

// Material Dark
const materialDarkTheme: ThemeColors = {
  bg: {
    base: '#212121',
    raised: '#292929',
    overlay: '#333333',
    elevated: '#424242',
  },
  fg: {
    default: '#eeffff',
    muted: '#b0bec5',
    subtle: '#616161',
    disabled: '#424242',
  },
  accent: {
    default: '#82aaff',
    hover: '#729fef',
    active: '#6294df',
    subtle: '#82aaff15',
    fg: '#212121',
  },
  status: {
    success: '#c3e88d',
    successSubtle: '#c3e88d20',
    warning: '#ffcb6b',
    warningSubtle: '#ffcb6b20',
    error: '#ff5370',
    errorSubtle: '#ff537020',
    info: '#89ddff',
    infoSubtle: '#89ddff20',
  },
  editor: {
    bg: '#212121',
    fg: '#eeffff',
    lineNumber: '#424242',
    lineNumberActive: '#eeffff',
    lineHighlight: '#292929',
    selection: '#82aaff30',
    cursor: '#ffcc00',
    matchingBracket: '#82aaff30',
    findMatch: '#ffcb6b40',
  },
  syntax: {
    keyword: '#c792ea',
    string: '#c3e88d',
    number: '#f78c6c',
    boolean: '#ff5370',
    comment: '#616161',
    function: '#82aaff',
    variable: '#eeffff',
    parameter: '#f78c6c',
    property: '#89ddff',
    operator: '#89ddff',
    punctuation: '#89ddff',
    class: '#ffcb6b',
    type: '#ffcb6b',
    constant: '#f78c6c',
    tag: '#f07178',
    attribute: '#ffcb6b',
    regex: '#89ddff',
    inserted: '#c3e88d',
    deleted: '#ff5370',
  },
  terminal: {
    bg: '#212121',
    fg: '#eeffff',
    cursor: '#ffcc00',
    selection: '#82aaff30',
    black: '#212121',
    red: '#ff5370',
    green: '#c3e88d',
    yellow: '#ffcb6b',
    blue: '#82aaff',
    magenta: '#c792ea',
    cyan: '#89ddff',
    white: '#eeffff',
    brightBlack: '#616161',
    brightRed: '#ff5370',
    brightGreen: '#c3e88d',
    brightYellow: '#ffcb6b',
    brightBlue: '#82aaff',
    brightMagenta: '#c792ea',
    brightCyan: '#89ddff',
    brightWhite: '#ffffff',
  },
};

// Material Darker
const materialDarkerTheme: ThemeColors = {
  bg: {
    base: '#212121',
    raised: '#1a1a1a',
    overlay: '#292929',
    elevated: '#333333',
  },
  fg: {
    default: '#eeffff',
    muted: '#b0bec5',
    subtle: '#616161',
    disabled: '#424242',
  },
  accent: {
    default: '#82aaff',
    hover: '#729fef',
    active: '#6294df',
    subtle: '#82aaff15',
    fg: '#212121',
  },
  status: {
    success: '#c3e88d',
    successSubtle: '#c3e88d20',
    warning: '#ffcb6b',
    warningSubtle: '#ffcb6b20',
    error: '#ff5370',
    errorSubtle: '#ff537020',
    info: '#89ddff',
    infoSubtle: '#89ddff20',
  },
  editor: {
    bg: '#212121',
    fg: '#eeffff',
    lineNumber: '#424242',
    lineNumberActive: '#eeffff',
    lineHighlight: '#1a1a1a',
    selection: '#82aaff30',
    cursor: '#ffcc00',
    matchingBracket: '#82aaff30',
    findMatch: '#ffcb6b40',
  },
  syntax: {
    keyword: '#c792ea',
    string: '#c3e88d',
    number: '#f78c6c',
    boolean: '#ff5370',
    comment: '#616161',
    function: '#82aaff',
    variable: '#eeffff',
    parameter: '#f78c6c',
    property: '#89ddff',
    operator: '#89ddff',
    punctuation: '#89ddff',
    class: '#ffcb6b',
    type: '#ffcb6b',
    constant: '#f78c6c',
    tag: '#f07178',
    attribute: '#ffcb6b',
    regex: '#89ddff',
    inserted: '#c3e88d',
    deleted: '#ff5370',
  },
  terminal: {
    bg: '#212121',
    fg: '#eeffff',
    cursor: '#ffcc00',
    selection: '#82aaff30',
    black: '#212121',
    red: '#ff5370',
    green: '#c3e88d',
    yellow: '#ffcb6b',
    blue: '#82aaff',
    magenta: '#c792ea',
    cyan: '#89ddff',
    white: '#eeffff',
    brightBlack: '#616161',
    brightRed: '#ff5370',
    brightGreen: '#c3e88d',
    brightYellow: '#ffcb6b',
    brightBlue: '#82aaff',
    brightMagenta: '#c792ea',
    brightCyan: '#89ddff',
    brightWhite: '#ffffff',
  },
};

// Material Palenight
const materialPalenightTheme: ThemeColors = {
  bg: {
    base: '#292d3e',
    raised: '#1b1e2b',
    overlay: '#34324a',
    elevated: '#444267',
  },
  fg: {
    default: '#a6accd',
    muted: '#8087a2',
    subtle: '#676e95',
    disabled: '#4e5579',
  },
  accent: {
    default: '#82aaff',
    hover: '#729fef',
    active: '#6294df',
    subtle: '#82aaff15',
    fg: '#292d3e',
  },
  status: {
    success: '#c3e88d',
    successSubtle: '#c3e88d20',
    warning: '#ffcb6b',
    warningSubtle: '#ffcb6b20',
    error: '#ff5370',
    errorSubtle: '#ff537020',
    info: '#89ddff',
    infoSubtle: '#89ddff20',
  },
  editor: {
    bg: '#292d3e',
    fg: '#a6accd',
    lineNumber: '#4e5579',
    lineNumberActive: '#a6accd',
    lineHighlight: '#1b1e2b',
    selection: '#82aaff30',
    cursor: '#ffcc00',
    matchingBracket: '#82aaff30',
    findMatch: '#ffcb6b40',
  },
  syntax: {
    keyword: '#c792ea',
    string: '#c3e88d',
    number: '#f78c6c',
    boolean: '#ff5370',
    comment: '#676e95',
    function: '#82aaff',
    variable: '#a6accd',
    parameter: '#f78c6c',
    property: '#89ddff',
    operator: '#89ddff',
    punctuation: '#89ddff',
    class: '#ffcb6b',
    type: '#ffcb6b',
    constant: '#f78c6c',
    tag: '#f07178',
    attribute: '#ffcb6b',
    regex: '#89ddff',
    inserted: '#c3e88d',
    deleted: '#ff5370',
  },
  terminal: {
    bg: '#292d3e',
    fg: '#a6accd',
    cursor: '#ffcc00',
    selection: '#82aaff30',
    black: '#292d3e',
    red: '#ff5370',
    green: '#c3e88d',
    yellow: '#ffcb6b',
    blue: '#82aaff',
    magenta: '#c792ea',
    cyan: '#89ddff',
    white: '#a6accd',
    brightBlack: '#676e95',
    brightRed: '#ff5370',
    brightGreen: '#c3e88d',
    brightYellow: '#ffcb6b',
    brightBlue: '#82aaff',
    brightMagenta: '#c792ea',
    brightCyan: '#89ddff',
    brightWhite: '#ffffff',
  },
};

// Material Oceanic
const materialOceanicTheme: ThemeColors = {
  bg: {
    base: '#263238',
    raised: '#1e272c',
    overlay: '#2e3c43',
    elevated: '#384850',
  },
  fg: {
    default: '#b0bec5',
    muted: '#78909c',
    subtle: '#546e7a',
    disabled: '#455a64',
  },
  accent: {
    default: '#80cbc4',
    hover: '#70bbb4',
    active: '#60aba4',
    subtle: '#80cbc415',
    fg: '#263238',
  },
  status: {
    success: '#c3e88d',
    successSubtle: '#c3e88d20',
    warning: '#ffcb6b',
    warningSubtle: '#ffcb6b20',
    error: '#ff5370',
    errorSubtle: '#ff537020',
    info: '#89ddff',
    infoSubtle: '#89ddff20',
  },
  editor: {
    bg: '#263238',
    fg: '#b0bec5',
    lineNumber: '#455a64',
    lineNumberActive: '#b0bec5',
    lineHighlight: '#1e272c',
    selection: '#80cbc430',
    cursor: '#ffcc00',
    matchingBracket: '#80cbc430',
    findMatch: '#ffcb6b40',
  },
  syntax: {
    keyword: '#c792ea',
    string: '#c3e88d',
    number: '#f78c6c',
    boolean: '#ff5370',
    comment: '#546e7a',
    function: '#82aaff',
    variable: '#b0bec5',
    parameter: '#f78c6c',
    property: '#89ddff',
    operator: '#89ddff',
    punctuation: '#89ddff',
    class: '#ffcb6b',
    type: '#ffcb6b',
    constant: '#f78c6c',
    tag: '#f07178',
    attribute: '#ffcb6b',
    regex: '#89ddff',
    inserted: '#c3e88d',
    deleted: '#ff5370',
  },
  terminal: {
    bg: '#263238',
    fg: '#b0bec5',
    cursor: '#ffcc00',
    selection: '#80cbc430',
    black: '#263238',
    red: '#ff5370',
    green: '#c3e88d',
    yellow: '#ffcb6b',
    blue: '#82aaff',
    magenta: '#c792ea',
    cyan: '#89ddff',
    white: '#b0bec5',
    brightBlack: '#546e7a',
    brightRed: '#ff5370',
    brightGreen: '#c3e88d',
    brightYellow: '#ffcb6b',
    brightBlue: '#82aaff',
    brightMagenta: '#c792ea',
    brightCyan: '#89ddff',
    brightWhite: '#ffffff',
  },
};

// Dracula Official
const draculaTheme: ThemeColors = {
  bg: {
    base: '#282a36',
    raised: '#21222c',
    overlay: '#343746',
    elevated: '#44475a',
  },
  fg: {
    default: '#f8f8f2',
    muted: '#bfbfbf',
    subtle: '#6272a4',
    disabled: '#44475a',
  },
  accent: {
    default: '#bd93f9',
    hover: '#ad83e9',
    active: '#9d73d9',
    subtle: '#bd93f915',
    fg: '#282a36',
  },
  status: {
    success: '#50fa7b',
    successSubtle: '#50fa7b20',
    warning: '#f1fa8c',
    warningSubtle: '#f1fa8c20',
    error: '#ff5555',
    errorSubtle: '#ff555520',
    info: '#8be9fd',
    infoSubtle: '#8be9fd20',
  },
  editor: {
    bg: '#282a36',
    fg: '#f8f8f2',
    lineNumber: '#6272a4',
    lineNumberActive: '#f8f8f2',
    lineHighlight: '#44475a',
    selection: '#44475a',
    cursor: '#f8f8f2',
    matchingBracket: '#44475a',
    findMatch: '#f1fa8c40',
  },
  syntax: {
    keyword: '#ff79c6',
    string: '#f1fa8c',
    number: '#bd93f9',
    boolean: '#bd93f9',
    comment: '#6272a4',
    function: '#50fa7b',
    variable: '#f8f8f2',
    parameter: '#ffb86c',
    property: '#66d9ef',
    operator: '#ff79c6',
    punctuation: '#f8f8f2',
    class: '#8be9fd',
    type: '#8be9fd',
    constant: '#bd93f9',
    tag: '#ff79c6',
    attribute: '#50fa7b',
    regex: '#f1fa8c',
    inserted: '#50fa7b',
    deleted: '#ff5555',
  },
  terminal: {
    bg: '#282a36',
    fg: '#f8f8f2',
    cursor: '#f8f8f2',
    selection: '#44475a',
    black: '#21222c',
    red: '#ff5555',
    green: '#50fa7b',
    yellow: '#f1fa8c',
    blue: '#bd93f9',
    magenta: '#ff79c6',
    cyan: '#8be9fd',
    white: '#f8f8f2',
    brightBlack: '#6272a4',
    brightRed: '#ff6e6e',
    brightGreen: '#69ff94',
    brightYellow: '#ffffa5',
    brightBlue: '#d6acff',
    brightMagenta: '#ff92df',
    brightCyan: '#a4ffff',
    brightWhite: '#ffffff',
  },
};

// Horizon
const horizonTheme: ThemeColors = {
  bg: {
    base: '#1c1e26',
    raised: '#232530',
    overlay: '#2e303e',
    elevated: '#3d3f4e',
  },
  fg: {
    default: '#e0e0e0',
    muted: '#9da0a2',
    subtle: '#6c6f93',
    disabled: '#4a4c5e',
  },
  accent: {
    default: '#e95678',
    hover: '#d94668',
    active: '#c93658',
    subtle: '#e9567815',
    fg: '#1c1e26',
  },
  status: {
    success: '#29d398',
    successSubtle: '#29d39820',
    warning: '#fab795',
    warningSubtle: '#fab79520',
    error: '#e95678',
    errorSubtle: '#e9567820',
    info: '#25b0bc',
    infoSubtle: '#25b0bc20',
  },
  editor: {
    bg: '#1c1e26',
    fg: '#e0e0e0',
    lineNumber: '#4a4c5e',
    lineNumberActive: '#e0e0e0',
    lineHighlight: '#232530',
    selection: '#e9567830',
    cursor: '#e95678',
    matchingBracket: '#e9567830',
    findMatch: '#fab79540',
  },
  syntax: {
    keyword: '#e95678',
    string: '#fab795',
    number: '#f09483',
    boolean: '#e95678',
    comment: '#6c6f93',
    function: '#25b0bc',
    variable: '#e0e0e0',
    parameter: '#fab795',
    property: '#b877db',
    operator: '#e95678',
    punctuation: '#e0e0e0',
    class: '#fac29a',
    type: '#fac29a',
    constant: '#f09483',
    tag: '#e95678',
    attribute: '#fab795',
    regex: '#25b0bc',
    inserted: '#29d398',
    deleted: '#e95678',
  },
  terminal: {
    bg: '#1c1e26',
    fg: '#e0e0e0',
    cursor: '#e95678',
    selection: '#e9567830',
    black: '#1c1e26',
    red: '#e95678',
    green: '#29d398',
    yellow: '#fab795',
    blue: '#26bbd9',
    magenta: '#b877db',
    cyan: '#59e3e3',
    white: '#e0e0e0',
    brightBlack: '#6c6f93',
    brightRed: '#ec6a88',
    brightGreen: '#3fdaa4',
    brightYellow: '#fbc3a7',
    brightBlue: '#3fc6de',
    brightMagenta: '#c38ddb',
    brightCyan: '#6be6e6',
    brightWhite: '#ffffff',
  },
};

// -----------------------------------------------------------------------------
// Monokai Theme
// -----------------------------------------------------------------------------

const monokaiTheme: ThemeColors = {
  bg: {
    base: '#272822',
    raised: '#2d2e27',
    overlay: '#3e3d32',
    elevated: '#49483e',
  },
  fg: {
    default: '#f8f8f2',
    muted: '#a6a69c',
    subtle: '#75715e',
    disabled: '#5c5c52',
  },
  accent: {
    default: '#a6e22e',
    hover: '#b6f23e',
    active: '#96d21e',
    subtle: '#a6e22e20',
    fg: '#272822',
  },
  status: {
    success: '#a6e22e',
    successSubtle: '#a6e22e20',
    warning: '#e6db74',
    warningSubtle: '#e6db7420',
    error: '#f92672',
    errorSubtle: '#f9267220',
    info: '#66d9ef',
    infoSubtle: '#66d9ef20',
  },
  editor: {
    bg: '#272822',
    fg: '#f8f8f2',
    lineNumber: '#75715e',
    lineNumberActive: '#f8f8f2',
    lineHighlight: '#3e3d32',
    selection: '#49483e',
    cursor: '#f8f8f2',
    matchingBracket: '#49483e',
    findMatch: '#e6db7460',
  },
  syntax: {
    keyword: '#f92672',
    string: '#e6db74',
    number: '#ae81ff',
    boolean: '#ae81ff',
    comment: '#75715e',
    function: '#a6e22e',
    variable: '#f8f8f2',
    parameter: '#fd971f',
    property: '#66d9ef',
    operator: '#f92672',
    punctuation: '#f8f8f2',
    class: '#a6e22e',
    type: '#66d9ef',
    constant: '#ae81ff',
    tag: '#f92672',
    attribute: '#a6e22e',
    regex: '#e6db74',
    inserted: '#a6e22e',
    deleted: '#f92672',
  },
  terminal: {
    bg: '#272822',
    fg: '#f8f8f2',
    cursor: '#f8f8f2',
    selection: '#49483e',
    black: '#272822',
    red: '#f92672',
    green: '#a6e22e',
    yellow: '#f4bf75',
    blue: '#66d9ef',
    magenta: '#ae81ff',
    cyan: '#a1efe4',
    white: '#f8f8f2',
    brightBlack: '#75715e',
    brightRed: '#f92672',
    brightGreen: '#a6e22e',
    brightYellow: '#f4bf75',
    brightBlue: '#66d9ef',
    brightMagenta: '#ae81ff',
    brightCyan: '#a1efe4',
    brightWhite: '#f9f8f5',
  },
};

// -----------------------------------------------------------------------------
// Synthwave 84 Theme
// -----------------------------------------------------------------------------

const synthwave84Theme: ThemeColors = {
  bg: {
    base: '#262335',
    raised: '#2a2139',
    overlay: '#34294f',
    elevated: '#3e3358',
  },
  fg: {
    default: '#ffffff',
    muted: '#b6a2d4',
    subtle: '#8a7ba8',
    disabled: '#5d4f7a',
  },
  accent: {
    default: '#ff7edb',
    hover: '#ff9de2',
    active: '#ff5fd4',
    subtle: '#ff7edb25',
    fg: '#262335',
  },
  status: {
    success: '#72f1b8',
    successSubtle: '#72f1b825',
    warning: '#fede5d',
    warningSubtle: '#fede5d25',
    error: '#fe4450',
    errorSubtle: '#fe445025',
    info: '#36f9f6',
    infoSubtle: '#36f9f625',
  },
  editor: {
    bg: '#262335',
    fg: '#ffffff',
    lineNumber: '#5d4f7a',
    lineNumberActive: '#ff7edb',
    lineHighlight: '#34294f',
    selection: '#ff7edb40',
    cursor: '#ff7edb',
    matchingBracket: '#ff7edb50',
    findMatch: '#fede5d50',
  },
  syntax: {
    keyword: '#fede5d',
    string: '#ff8b39',
    number: '#f97e72',
    boolean: '#ff7edb',
    comment: '#848bbd',
    function: '#36f9f6',
    variable: '#ffffff',
    parameter: '#fe4450',
    property: '#72f1b8',
    operator: '#fede5d',
    punctuation: '#ffffff',
    class: '#ff7edb',
    type: '#36f9f6',
    constant: '#f97e72',
    tag: '#ff7edb',
    attribute: '#72f1b8',
    regex: '#ff8b39',
    inserted: '#72f1b8',
    deleted: '#fe4450',
  },
  terminal: {
    bg: '#262335',
    fg: '#ffffff',
    cursor: '#ff7edb',
    selection: '#ff7edb40',
    black: '#262335',
    red: '#fe4450',
    green: '#72f1b8',
    yellow: '#fede5d',
    blue: '#03edf9',
    magenta: '#ff7edb',
    cyan: '#36f9f6',
    white: '#ffffff',
    brightBlack: '#5d4f7a',
    brightRed: '#f97e72',
    brightGreen: '#8af8c7',
    brightYellow: '#fff493',
    brightBlue: '#6ee7ff',
    brightMagenta: '#ff9de2',
    brightCyan: '#72f9f9',
    brightWhite: '#ffffff',
  },
};

// -----------------------------------------------------------------------------
// GitHub Dark Theme
// -----------------------------------------------------------------------------

const githubDarkTheme: ThemeColors = {
  bg: {
    base: '#0d1117',
    raised: '#161b22',
    overlay: '#21262d',
    elevated: '#30363d',
  },
  fg: {
    default: '#c9d1d9',
    muted: '#8b949e',
    subtle: '#6e7681',
    disabled: '#484f58',
  },
  accent: {
    default: '#58a6ff',
    hover: '#79b8ff',
    active: '#388bfd',
    subtle: '#58a6ff20',
    fg: '#0d1117',
  },
  status: {
    success: '#3fb950',
    successSubtle: '#3fb95020',
    warning: '#d29922',
    warningSubtle: '#d2992220',
    error: '#f85149',
    errorSubtle: '#f8514920',
    info: '#58a6ff',
    infoSubtle: '#58a6ff20',
  },
  editor: {
    bg: '#0d1117',
    fg: '#c9d1d9',
    lineNumber: '#6e7681',
    lineNumberActive: '#c9d1d9',
    lineHighlight: '#161b22',
    selection: '#58a6ff40',
    cursor: '#c9d1d9',
    matchingBracket: '#58a6ff40',
    findMatch: '#d2992260',
  },
  syntax: {
    keyword: '#ff7b72',
    string: '#a5d6ff',
    number: '#79c0ff',
    boolean: '#79c0ff',
    comment: '#8b949e',
    function: '#d2a8ff',
    variable: '#c9d1d9',
    parameter: '#ffa657',
    property: '#79c0ff',
    operator: '#ff7b72',
    punctuation: '#c9d1d9',
    class: '#ffa657',
    type: '#ffa657',
    constant: '#79c0ff',
    tag: '#7ee787',
    attribute: '#79c0ff',
    regex: '#a5d6ff',
    inserted: '#3fb950',
    deleted: '#f85149',
  },
  terminal: {
    bg: '#0d1117',
    fg: '#c9d1d9',
    cursor: '#c9d1d9',
    selection: '#58a6ff40',
    black: '#484f58',
    red: '#ff7b72',
    green: '#3fb950',
    yellow: '#d29922',
    blue: '#58a6ff',
    magenta: '#bc8cff',
    cyan: '#39c5cf',
    white: '#b1bac4',
    brightBlack: '#6e7681',
    brightRed: '#ffa198',
    brightGreen: '#56d364',
    brightYellow: '#e3b341',
    brightBlue: '#79c0ff',
    brightMagenta: '#d2a8ff',
    brightCyan: '#56d4dd',
    brightWhite: '#f0f6fc',
  },
};

// -----------------------------------------------------------------------------
// GitHub Light Theme
// -----------------------------------------------------------------------------

const githubLightTheme: ThemeColors = {
  bg: {
    base: '#ffffff',
    raised: '#f6f8fa',
    overlay: '#eaeef2',
    elevated: '#d0d7de',
  },
  fg: {
    default: '#24292f',
    muted: '#57606a',
    subtle: '#6e7781',
    disabled: '#8c959f',
  },
  accent: {
    default: '#0969da',
    hover: '#0550ae',
    active: '#033d8b',
    subtle: '#0969da15',
    fg: '#ffffff',
  },
  status: {
    success: '#1a7f37',
    successSubtle: '#1a7f3715',
    warning: '#9a6700',
    warningSubtle: '#9a670015',
    error: '#cf222e',
    errorSubtle: '#cf222e15',
    info: '#0969da',
    infoSubtle: '#0969da15',
  },
  editor: {
    bg: '#ffffff',
    fg: '#24292f',
    lineNumber: '#8c959f',
    lineNumberActive: '#24292f',
    lineHighlight: '#f6f8fa',
    selection: '#0969da30',
    cursor: '#24292f',
    matchingBracket: '#0969da30',
    findMatch: '#fff8c5',
  },
  syntax: {
    keyword: '#cf222e',
    string: '#0a3069',
    number: '#0550ae',
    boolean: '#0550ae',
    comment: '#6e7781',
    function: '#8250df',
    variable: '#24292f',
    parameter: '#953800',
    property: '#0550ae',
    operator: '#cf222e',
    punctuation: '#24292f',
    class: '#953800',
    type: '#953800',
    constant: '#0550ae',
    tag: '#116329',
    attribute: '#0550ae',
    regex: '#0a3069',
    inserted: '#1a7f37',
    deleted: '#cf222e',
  },
  terminal: {
    bg: '#ffffff',
    fg: '#24292f',
    cursor: '#24292f',
    selection: '#0969da30',
    black: '#24292f',
    red: '#cf222e',
    green: '#1a7f37',
    yellow: '#9a6700',
    blue: '#0969da',
    magenta: '#8250df',
    cyan: '#1b7c83',
    white: '#6e7781',
    brightBlack: '#57606a',
    brightRed: '#a40e26',
    brightGreen: '#2da44e',
    brightYellow: '#bf8700',
    brightBlue: '#218bff',
    brightMagenta: '#a475f9',
    brightCyan: '#3192aa',
    brightWhite: '#8c959f',
  },
};

// -----------------------------------------------------------------------------
// Ayu Dark Theme
// -----------------------------------------------------------------------------

const ayuDarkTheme: ThemeColors = {
  bg: {
    base: '#0b0e14',
    raised: '#0d1017',
    overlay: '#131721',
    elevated: '#1c212b',
  },
  fg: {
    default: '#bfbdb6',
    muted: '#6c7380',
    subtle: '#565b66',
    disabled: '#3d424d',
  },
  accent: {
    default: '#e6b450',
    hover: '#f0c060',
    active: '#dca840',
    subtle: '#e6b45020',
    fg: '#0b0e14',
  },
  status: {
    success: '#7fd962',
    successSubtle: '#7fd96220',
    warning: '#ffb454',
    warningSubtle: '#ffb45420',
    error: '#d95757',
    errorSubtle: '#d9575720',
    info: '#59c2ff',
    infoSubtle: '#59c2ff20',
  },
  editor: {
    bg: '#0b0e14',
    fg: '#bfbdb6',
    lineNumber: '#3d424d',
    lineNumberActive: '#6c7380',
    lineHighlight: '#0d1017',
    selection: '#409fff40',
    cursor: '#e6b450',
    matchingBracket: '#e6b45040',
    findMatch: '#ffb45440',
  },
  syntax: {
    keyword: '#ff8f40',
    string: '#aad94c',
    number: '#d2a6ff',
    boolean: '#d2a6ff',
    comment: '#636a72',
    function: '#ffb454',
    variable: '#bfbdb6',
    parameter: '#d2a6ff',
    property: '#39bae6',
    operator: '#f29668',
    punctuation: '#bfbdb6',
    class: '#59c2ff',
    type: '#39bae6',
    constant: '#d2a6ff',
    tag: '#39bae6',
    attribute: '#ffb454',
    regex: '#95e6cb',
    inserted: '#7fd962',
    deleted: '#d95757',
  },
  terminal: {
    bg: '#0b0e14',
    fg: '#bfbdb6',
    cursor: '#e6b450',
    selection: '#409fff40',
    black: '#0b0e14',
    red: '#d95757',
    green: '#7fd962',
    yellow: '#ffb454',
    blue: '#59c2ff',
    magenta: '#d2a6ff',
    cyan: '#95e6cb',
    white: '#bfbdb6',
    brightBlack: '#636a72',
    brightRed: '#f07178',
    brightGreen: '#aad94c',
    brightYellow: '#e6b450',
    brightBlue: '#73d0ff',
    brightMagenta: '#dfbfff',
    brightCyan: '#95e6cb',
    brightWhite: '#f8f8f2',
  },
};

// -----------------------------------------------------------------------------
// Ayu Mirage Theme
// -----------------------------------------------------------------------------

const ayuMirageTheme: ThemeColors = {
  bg: {
    base: '#1f2430',
    raised: '#232834',
    overlay: '#2a303c',
    elevated: '#333a47',
  },
  fg: {
    default: '#cbccc6',
    muted: '#707a8c',
    subtle: '#5c6773',
    disabled: '#454d5d',
  },
  accent: {
    default: '#ffcc66',
    hover: '#ffd580',
    active: '#f5c050',
    subtle: '#ffcc6620',
    fg: '#1f2430',
  },
  status: {
    success: '#87d96c',
    successSubtle: '#87d96c20',
    warning: '#ffc44c',
    warningSubtle: '#ffc44c20',
    error: '#f28779',
    errorSubtle: '#f2877920',
    info: '#5ccfe6',
    infoSubtle: '#5ccfe620',
  },
  editor: {
    bg: '#1f2430',
    fg: '#cbccc6',
    lineNumber: '#454d5d',
    lineNumberActive: '#707a8c',
    lineHighlight: '#232834',
    selection: '#34455a',
    cursor: '#ffcc66',
    matchingBracket: '#ffcc6640',
    findMatch: '#ffc44c40',
  },
  syntax: {
    keyword: '#ffa759',
    string: '#bae67e',
    number: '#dfbfff',
    boolean: '#dfbfff',
    comment: '#5c6773',
    function: '#ffd580',
    variable: '#cbccc6',
    parameter: '#dfbfff',
    property: '#5ccfe6',
    operator: '#f29e74',
    punctuation: '#cbccc6',
    class: '#73d0ff',
    type: '#5ccfe6',
    constant: '#dfbfff',
    tag: '#5ccfe6',
    attribute: '#ffd580',
    regex: '#95e6cb',
    inserted: '#87d96c',
    deleted: '#f28779',
  },
  terminal: {
    bg: '#1f2430',
    fg: '#cbccc6',
    cursor: '#ffcc66',
    selection: '#34455a',
    black: '#1f2430',
    red: '#f28779',
    green: '#87d96c',
    yellow: '#ffc44c',
    blue: '#5ccfe6',
    magenta: '#dfbfff',
    cyan: '#95e6cb',
    white: '#cbccc6',
    brightBlack: '#5c6773',
    brightRed: '#f28779',
    brightGreen: '#bae67e',
    brightYellow: '#ffcc66',
    brightBlue: '#73d0ff',
    brightMagenta: '#dfbfff',
    brightCyan: '#95e6cb',
    brightWhite: '#f8f8f2',
  },
};

// -----------------------------------------------------------------------------
// Ayu Light Theme
// -----------------------------------------------------------------------------

const ayuLightTheme: ThemeColors = {
  bg: {
    base: '#fafafa',
    raised: '#f3f4f5',
    overlay: '#e8e9eb',
    elevated: '#d4d5d7',
  },
  fg: {
    default: '#5c6166',
    muted: '#787b80',
    subtle: '#8a8d91',
    disabled: '#a8aaad',
  },
  accent: {
    default: '#ff9940',
    hover: '#ffa64d',
    active: '#f08c33',
    subtle: '#ff994015',
    fg: '#ffffff',
  },
  status: {
    success: '#6cbf43',
    successSubtle: '#6cbf4315',
    warning: '#f2ae49',
    warningSubtle: '#f2ae4915',
    error: '#e65050',
    errorSubtle: '#e6505015',
    info: '#399ee6',
    infoSubtle: '#399ee615',
  },
  editor: {
    bg: '#fafafa',
    fg: '#5c6166',
    lineNumber: '#a8aaad',
    lineNumberActive: '#5c6166',
    lineHighlight: '#f3f4f5',
    selection: '#399ee630',
    cursor: '#ff9940',
    matchingBracket: '#ff994030',
    findMatch: '#f2ae4940',
  },
  syntax: {
    keyword: '#fa8d3e',
    string: '#86b300',
    number: '#a37acc',
    boolean: '#a37acc',
    comment: '#8a9199',
    function: '#f2ae49',
    variable: '#5c6166',
    parameter: '#a37acc',
    property: '#399ee6',
    operator: '#ed9366',
    punctuation: '#5c6166',
    class: '#399ee6',
    type: '#399ee6',
    constant: '#a37acc',
    tag: '#55b4d4',
    attribute: '#f2ae49',
    regex: '#4cbf99',
    inserted: '#6cbf43',
    deleted: '#e65050',
  },
  terminal: {
    bg: '#fafafa',
    fg: '#5c6166',
    cursor: '#ff9940',
    selection: '#399ee630',
    black: '#5c6166',
    red: '#e65050',
    green: '#6cbf43',
    yellow: '#f2ae49',
    blue: '#399ee6',
    magenta: '#a37acc',
    cyan: '#4cbf99',
    white: '#f3f4f5',
    brightBlack: '#8a8d91',
    brightRed: '#f07171',
    brightGreen: '#86b300',
    brightYellow: '#ff9940',
    brightBlue: '#55b4d4',
    brightMagenta: '#a37acc',
    brightCyan: '#4cbf99',
    brightWhite: '#fafafa',
  },
};

// -----------------------------------------------------------------------------
// Solarized Dark Theme
// -----------------------------------------------------------------------------

const solarizedDarkTheme: ThemeColors = {
  bg: {
    base: '#002b36',
    raised: '#073642',
    overlay: '#0a4050',
    elevated: '#0d4f5f',
  },
  fg: {
    default: '#839496',
    muted: '#657b83',
    subtle: '#586e75',
    disabled: '#4a5d63',
  },
  accent: {
    default: '#268bd2',
    hover: '#2e9fe6',
    active: '#1e7dbe',
    subtle: '#268bd220',
    fg: '#fdf6e3',
  },
  status: {
    success: '#859900',
    successSubtle: '#85990020',
    warning: '#b58900',
    warningSubtle: '#b5890020',
    error: '#dc322f',
    errorSubtle: '#dc322f20',
    info: '#268bd2',
    infoSubtle: '#268bd220',
  },
  editor: {
    bg: '#002b36',
    fg: '#839496',
    lineNumber: '#586e75',
    lineNumberActive: '#839496',
    lineHighlight: '#073642',
    selection: '#268bd240',
    cursor: '#839496',
    matchingBracket: '#268bd240',
    findMatch: '#b5890050',
  },
  syntax: {
    keyword: '#859900',
    string: '#2aa198',
    number: '#d33682',
    boolean: '#cb4b16',
    comment: '#586e75',
    function: '#268bd2',
    variable: '#839496',
    parameter: '#cb4b16',
    property: '#268bd2',
    operator: '#859900',
    punctuation: '#839496',
    class: '#cb4b16',
    type: '#b58900',
    constant: '#d33682',
    tag: '#268bd2',
    attribute: '#b58900',
    regex: '#2aa198',
    inserted: '#859900',
    deleted: '#dc322f',
  },
  terminal: {
    bg: '#002b36',
    fg: '#839496',
    cursor: '#839496',
    selection: '#268bd240',
    black: '#073642',
    red: '#dc322f',
    green: '#859900',
    yellow: '#b58900',
    blue: '#268bd2',
    magenta: '#d33682',
    cyan: '#2aa198',
    white: '#eee8d5',
    brightBlack: '#586e75',
    brightRed: '#cb4b16',
    brightGreen: '#586e75',
    brightYellow: '#657b83',
    brightBlue: '#839496',
    brightMagenta: '#6c71c4',
    brightCyan: '#93a1a1',
    brightWhite: '#fdf6e3',
  },
};

// -----------------------------------------------------------------------------
// Solarized Light Theme
// -----------------------------------------------------------------------------

const solarizedLightTheme: ThemeColors = {
  bg: {
    base: '#fdf6e3',
    raised: '#eee8d5',
    overlay: '#ddd6c3',
    elevated: '#ccc4b1',
  },
  fg: {
    default: '#657b83',
    muted: '#839496',
    subtle: '#93a1a1',
    disabled: '#a8b4b4',
  },
  accent: {
    default: '#268bd2',
    hover: '#2e9fe6',
    active: '#1e7dbe',
    subtle: '#268bd215',
    fg: '#fdf6e3',
  },
  status: {
    success: '#859900',
    successSubtle: '#85990015',
    warning: '#b58900',
    warningSubtle: '#b5890015',
    error: '#dc322f',
    errorSubtle: '#dc322f15',
    info: '#268bd2',
    infoSubtle: '#268bd215',
  },
  editor: {
    bg: '#fdf6e3',
    fg: '#657b83',
    lineNumber: '#93a1a1',
    lineNumberActive: '#657b83',
    lineHighlight: '#eee8d5',
    selection: '#268bd230',
    cursor: '#657b83',
    matchingBracket: '#268bd230',
    findMatch: '#b5890040',
  },
  syntax: {
    keyword: '#859900',
    string: '#2aa198',
    number: '#d33682',
    boolean: '#cb4b16',
    comment: '#93a1a1',
    function: '#268bd2',
    variable: '#657b83',
    parameter: '#cb4b16',
    property: '#268bd2',
    operator: '#859900',
    punctuation: '#657b83',
    class: '#cb4b16',
    type: '#b58900',
    constant: '#d33682',
    tag: '#268bd2',
    attribute: '#b58900',
    regex: '#2aa198',
    inserted: '#859900',
    deleted: '#dc322f',
  },
  terminal: {
    bg: '#fdf6e3',
    fg: '#657b83',
    cursor: '#657b83',
    selection: '#268bd230',
    black: '#073642',
    red: '#dc322f',
    green: '#859900',
    yellow: '#b58900',
    blue: '#268bd2',
    magenta: '#d33682',
    cyan: '#2aa198',
    white: '#eee8d5',
    brightBlack: '#002b36',
    brightRed: '#cb4b16',
    brightGreen: '#586e75',
    brightYellow: '#657b83',
    brightBlue: '#839496',
    brightMagenta: '#6c71c4',
    brightCyan: '#93a1a1',
    brightWhite: '#fdf6e3',
  },
};

// -----------------------------------------------------------------------------
// Rose Pine Theme
// -----------------------------------------------------------------------------

const rosePineTheme: ThemeColors = {
  bg: {
    base: '#191724',
    raised: '#1f1d2e',
    overlay: '#26233a',
    elevated: '#2a273f',
  },
  fg: {
    default: '#e0def4',
    muted: '#908caa',
    subtle: '#6e6a86',
    disabled: '#524f67',
  },
  accent: {
    default: '#c4a7e7',
    hover: '#d4baf7',
    active: '#b496d7',
    subtle: '#c4a7e720',
    fg: '#191724',
  },
  status: {
    success: '#9ccfd8',
    successSubtle: '#9ccfd820',
    warning: '#f6c177',
    warningSubtle: '#f6c17720',
    error: '#eb6f92',
    errorSubtle: '#eb6f9220',
    info: '#31748f',
    infoSubtle: '#31748f20',
  },
  editor: {
    bg: '#191724',
    fg: '#e0def4',
    lineNumber: '#524f67',
    lineNumberActive: '#908caa',
    lineHighlight: '#1f1d2e',
    selection: '#2a283e',
    cursor: '#c4a7e7',
    matchingBracket: '#c4a7e740',
    findMatch: '#f6c17750',
  },
  syntax: {
    keyword: '#31748f',
    string: '#f6c177',
    number: '#ebbcba',
    boolean: '#ebbcba',
    comment: '#6e6a86',
    function: '#eb6f92',
    variable: '#e0def4',
    parameter: '#c4a7e7',
    property: '#9ccfd8',
    operator: '#31748f',
    punctuation: '#908caa',
    class: '#9ccfd8',
    type: '#9ccfd8',
    constant: '#ebbcba',
    tag: '#31748f',
    attribute: '#c4a7e7',
    regex: '#f6c177',
    inserted: '#9ccfd8',
    deleted: '#eb6f92',
  },
  terminal: {
    bg: '#191724',
    fg: '#e0def4',
    cursor: '#c4a7e7',
    selection: '#2a283e',
    black: '#26233a',
    red: '#eb6f92',
    green: '#9ccfd8',
    yellow: '#f6c177',
    blue: '#31748f',
    magenta: '#c4a7e7',
    cyan: '#9ccfd8',
    white: '#e0def4',
    brightBlack: '#6e6a86',
    brightRed: '#eb6f92',
    brightGreen: '#9ccfd8',
    brightYellow: '#f6c177',
    brightBlue: '#31748f',
    brightMagenta: '#c4a7e7',
    brightCyan: '#ebbcba',
    brightWhite: '#e0def4',
  },
};

// -----------------------------------------------------------------------------
// Rose Pine Dawn Theme
// -----------------------------------------------------------------------------

const rosePineDawnTheme: ThemeColors = {
  bg: {
    base: '#faf4ed',
    raised: '#fffaf3',
    overlay: '#f2e9e1',
    elevated: '#e4dcd4',
  },
  fg: {
    default: '#575279',
    muted: '#797593',
    subtle: '#9893a5',
    disabled: '#b4b0be',
  },
  accent: {
    default: '#907aa9',
    hover: '#a08ab9',
    active: '#806a99',
    subtle: '#907aa915',
    fg: '#faf4ed',
  },
  status: {
    success: '#56949f',
    successSubtle: '#56949f15',
    warning: '#ea9d34',
    warningSubtle: '#ea9d3415',
    error: '#b4637a',
    errorSubtle: '#b4637a15',
    info: '#286983',
    infoSubtle: '#28698315',
  },
  editor: {
    bg: '#faf4ed',
    fg: '#575279',
    lineNumber: '#b4b0be',
    lineNumberActive: '#797593',
    lineHighlight: '#fffaf3',
    selection: '#dfdad9',
    cursor: '#907aa9',
    matchingBracket: '#907aa930',
    findMatch: '#ea9d3440',
  },
  syntax: {
    keyword: '#286983',
    string: '#ea9d34',
    number: '#d7827e',
    boolean: '#d7827e',
    comment: '#9893a5',
    function: '#b4637a',
    variable: '#575279',
    parameter: '#907aa9',
    property: '#56949f',
    operator: '#286983',
    punctuation: '#797593',
    class: '#56949f',
    type: '#56949f',
    constant: '#d7827e',
    tag: '#286983',
    attribute: '#907aa9',
    regex: '#ea9d34',
    inserted: '#56949f',
    deleted: '#b4637a',
  },
  terminal: {
    bg: '#faf4ed',
    fg: '#575279',
    cursor: '#907aa9',
    selection: '#dfdad9',
    black: '#575279',
    red: '#b4637a',
    green: '#56949f',
    yellow: '#ea9d34',
    blue: '#286983',
    magenta: '#907aa9',
    cyan: '#56949f',
    white: '#fffaf3',
    brightBlack: '#9893a5',
    brightRed: '#b4637a',
    brightGreen: '#56949f',
    brightYellow: '#ea9d34',
    brightBlue: '#286983',
    brightMagenta: '#907aa9',
    brightCyan: '#d7827e',
    brightWhite: '#faf4ed',
  },
};

// -----------------------------------------------------------------------------
// Everforest Dark Theme
// -----------------------------------------------------------------------------

const everforestDarkTheme: ThemeColors = {
  bg: {
    base: '#2d353b',
    raised: '#343f44',
    overlay: '#3d484d',
    elevated: '#475258',
  },
  fg: {
    default: '#d3c6aa',
    muted: '#9da9a0',
    subtle: '#7a8478',
    disabled: '#5c6559',
  },
  accent: {
    default: '#a7c080',
    hover: '#b7d090',
    active: '#97b070',
    subtle: '#a7c08020',
    fg: '#2d353b',
  },
  status: {
    success: '#a7c080',
    successSubtle: '#a7c08020',
    warning: '#dbbc7f',
    warningSubtle: '#dbbc7f20',
    error: '#e67e80',
    errorSubtle: '#e67e8020',
    info: '#7fbbb3',
    infoSubtle: '#7fbbb320',
  },
  editor: {
    bg: '#2d353b',
    fg: '#d3c6aa',
    lineNumber: '#5c6559',
    lineNumberActive: '#9da9a0',
    lineHighlight: '#343f44',
    selection: '#475258',
    cursor: '#d3c6aa',
    matchingBracket: '#a7c08040',
    findMatch: '#dbbc7f50',
  },
  syntax: {
    keyword: '#e67e80',
    string: '#a7c080',
    number: '#d699b6',
    boolean: '#d699b6',
    comment: '#7a8478',
    function: '#a7c080',
    variable: '#d3c6aa',
    parameter: '#d699b6',
    property: '#7fbbb3',
    operator: '#e67e80',
    punctuation: '#d3c6aa',
    class: '#dbbc7f',
    type: '#7fbbb3',
    constant: '#d699b6',
    tag: '#e67e80',
    attribute: '#dbbc7f',
    regex: '#a7c080',
    inserted: '#a7c080',
    deleted: '#e67e80',
  },
  terminal: {
    bg: '#2d353b',
    fg: '#d3c6aa',
    cursor: '#d3c6aa',
    selection: '#475258',
    black: '#343f44',
    red: '#e67e80',
    green: '#a7c080',
    yellow: '#dbbc7f',
    blue: '#7fbbb3',
    magenta: '#d699b6',
    cyan: '#83c092',
    white: '#d3c6aa',
    brightBlack: '#5c6559',
    brightRed: '#e67e80',
    brightGreen: '#a7c080',
    brightYellow: '#dbbc7f',
    brightBlue: '#7fbbb3',
    brightMagenta: '#d699b6',
    brightCyan: '#83c092',
    brightWhite: '#d3c6aa',
  },
};

// -----------------------------------------------------------------------------
// Everforest Light Theme
// -----------------------------------------------------------------------------

const everforestLightTheme: ThemeColors = {
  bg: {
    base: '#fdf6e3',
    raised: '#f4f0d9',
    overlay: '#e6e2cc',
    elevated: '#d8d3ba',
  },
  fg: {
    default: '#5c6a72',
    muted: '#708089',
    subtle: '#829181',
    disabled: '#a0aa9b',
  },
  accent: {
    default: '#8da101',
    hover: '#9db111',
    active: '#7d9100',
    subtle: '#8da10115',
    fg: '#fdf6e3',
  },
  status: {
    success: '#8da101',
    successSubtle: '#8da10115',
    warning: '#dfa000',
    warningSubtle: '#dfa00015',
    error: '#f85552',
    errorSubtle: '#f8555215',
    info: '#3a94c5',
    infoSubtle: '#3a94c515',
  },
  editor: {
    bg: '#fdf6e3',
    fg: '#5c6a72',
    lineNumber: '#a0aa9b',
    lineNumberActive: '#708089',
    lineHighlight: '#f4f0d9',
    selection: '#e6e2cc',
    cursor: '#5c6a72',
    matchingBracket: '#8da10130',
    findMatch: '#dfa00040',
  },
  syntax: {
    keyword: '#f85552',
    string: '#8da101',
    number: '#df69ba',
    boolean: '#df69ba',
    comment: '#829181',
    function: '#8da101',
    variable: '#5c6a72',
    parameter: '#df69ba',
    property: '#3a94c5',
    operator: '#f85552',
    punctuation: '#5c6a72',
    class: '#dfa000',
    type: '#3a94c5',
    constant: '#df69ba',
    tag: '#f85552',
    attribute: '#dfa000',
    regex: '#8da101',
    inserted: '#8da101',
    deleted: '#f85552',
  },
  terminal: {
    bg: '#fdf6e3',
    fg: '#5c6a72',
    cursor: '#5c6a72',
    selection: '#e6e2cc',
    black: '#5c6a72',
    red: '#f85552',
    green: '#8da101',
    yellow: '#dfa000',
    blue: '#3a94c5',
    magenta: '#df69ba',
    cyan: '#35a77c',
    white: '#fdf6e3',
    brightBlack: '#829181',
    brightRed: '#f85552',
    brightGreen: '#8da101',
    brightYellow: '#dfa000',
    brightBlue: '#3a94c5',
    brightMagenta: '#df69ba',
    brightCyan: '#35a77c',
    brightWhite: '#fdf6e3',
  },
};

// -----------------------------------------------------------------------------
// Kanagawa Theme
// -----------------------------------------------------------------------------

const kanagawaTheme: ThemeColors = {
  bg: {
    base: '#1f1f28',
    raised: '#2a2a37',
    overlay: '#363646',
    elevated: '#3c3c51',
  },
  fg: {
    default: '#dcd7ba',
    muted: '#c8c093',
    subtle: '#727169',
    disabled: '#54546d',
  },
  accent: {
    default: '#7e9cd8',
    hover: '#8eace8',
    active: '#6e8cc8',
    subtle: '#7e9cd820',
    fg: '#1f1f28',
  },
  status: {
    success: '#98bb6c',
    successSubtle: '#98bb6c20',
    warning: '#e6c384',
    warningSubtle: '#e6c38420',
    error: '#c34043',
    errorSubtle: '#c3404320',
    info: '#7fb4ca',
    infoSubtle: '#7fb4ca20',
  },
  editor: {
    bg: '#1f1f28',
    fg: '#dcd7ba',
    lineNumber: '#54546d',
    lineNumberActive: '#c8c093',
    lineHighlight: '#2a2a37',
    selection: '#2d4f67',
    cursor: '#c8c093',
    matchingBracket: '#7e9cd840',
    findMatch: '#e6c38450',
  },
  syntax: {
    keyword: '#957fb8',
    string: '#98bb6c',
    number: '#d27e99',
    boolean: '#ff5d62',
    comment: '#727169',
    function: '#7e9cd8',
    variable: '#dcd7ba',
    parameter: '#e6c384',
    property: '#7fb4ca',
    operator: '#c0a36e',
    punctuation: '#9cabca',
    class: '#7aa89f',
    type: '#7aa89f',
    constant: '#ffa066',
    tag: '#e46876',
    attribute: '#e6c384',
    regex: '#98bb6c',
    inserted: '#98bb6c',
    deleted: '#c34043',
  },
  terminal: {
    bg: '#1f1f28',
    fg: '#dcd7ba',
    cursor: '#c8c093',
    selection: '#2d4f67',
    black: '#090618',
    red: '#c34043',
    green: '#76946a',
    yellow: '#c0a36e',
    blue: '#7e9cd8',
    magenta: '#957fb8',
    cyan: '#6a9589',
    white: '#c8c093',
    brightBlack: '#727169',
    brightRed: '#e82424',
    brightGreen: '#98bb6c',
    brightYellow: '#e6c384',
    brightBlue: '#7fb4ca',
    brightMagenta: '#938aa9',
    brightCyan: '#7aa89f',
    brightWhite: '#dcd7ba',
  },
};

// -----------------------------------------------------------------------------
// Night Owl Theme
// -----------------------------------------------------------------------------

const nightOwlTheme: ThemeColors = {
  bg: {
    base: '#011627',
    raised: '#0b2942',
    overlay: '#112e47',
    elevated: '#1a3a52',
  },
  fg: {
    default: '#d6deeb',
    muted: '#a2aabc',
    subtle: '#637777',
    disabled: '#4b6479',
  },
  accent: {
    default: '#82aaff',
    hover: '#92baff',
    active: '#729aef',
    subtle: '#82aaff20',
    fg: '#011627',
  },
  status: {
    success: '#22da6e',
    successSubtle: '#22da6e20',
    warning: '#ffcb8b',
    warningSubtle: '#ffcb8b20',
    error: '#ef5350',
    errorSubtle: '#ef535020',
    info: '#82aaff',
    infoSubtle: '#82aaff20',
  },
  editor: {
    bg: '#011627',
    fg: '#d6deeb',
    lineNumber: '#4b6479',
    lineNumberActive: '#a2aabc',
    lineHighlight: '#0b2942',
    selection: '#1d3b53',
    cursor: '#80a4c2',
    matchingBracket: '#82aaff40',
    findMatch: '#ffcb8b50',
  },
  syntax: {
    keyword: '#c792ea',
    string: '#ecc48d',
    number: '#f78c6c',
    boolean: '#ff5874',
    comment: '#637777',
    function: '#82aaff',
    variable: '#d6deeb',
    parameter: '#7fdbca',
    property: '#80cbc4',
    operator: '#c792ea',
    punctuation: '#d6deeb',
    class: '#ffcb8b',
    type: '#82aaff',
    constant: '#f78c6c',
    tag: '#caece6',
    attribute: '#addb67',
    regex: '#ecc48d',
    inserted: '#22da6e',
    deleted: '#ef5350',
  },
  terminal: {
    bg: '#011627',
    fg: '#d6deeb',
    cursor: '#80a4c2',
    selection: '#1d3b53',
    black: '#011627',
    red: '#ef5350',
    green: '#22da6e',
    yellow: '#ffeb95',
    blue: '#82aaff',
    magenta: '#c792ea',
    cyan: '#7fdbca',
    white: '#d6deeb',
    brightBlack: '#637777',
    brightRed: '#f78c6c',
    brightGreen: '#addb67',
    brightYellow: '#ffcb8b',
    brightBlue: '#82aaff',
    brightMagenta: '#c792ea',
    brightCyan: '#7fdbca',
    brightWhite: '#ffffff',
  },
};

// -----------------------------------------------------------------------------
// Vitesse Dark Theme
// -----------------------------------------------------------------------------

const vitesseDarkTheme: ThemeColors = {
  bg: {
    base: '#121212',
    raised: '#1a1a1a',
    overlay: '#222222',
    elevated: '#2a2a2a',
  },
  fg: {
    default: '#dbd7ca',
    muted: '#a6a69c',
    subtle: '#6e6e5e',
    disabled: '#4e4e42',
  },
  accent: {
    default: '#4d9375',
    hover: '#5da385',
    active: '#3d8365',
    subtle: '#4d937520',
    fg: '#121212',
  },
  status: {
    success: '#4d9375',
    successSubtle: '#4d937520',
    warning: '#e6cc77',
    warningSubtle: '#e6cc7720',
    error: '#cb7676',
    errorSubtle: '#cb767620',
    info: '#6394bf',
    infoSubtle: '#6394bf20',
  },
  editor: {
    bg: '#121212',
    fg: '#dbd7ca',
    lineNumber: '#4e4e42',
    lineNumberActive: '#a6a69c',
    lineHighlight: '#1a1a1a',
    selection: '#2a2a2a',
    cursor: '#dbd7ca',
    matchingBracket: '#4d937540',
    findMatch: '#e6cc7750',
  },
  syntax: {
    keyword: '#4d9375',
    string: '#c98a7d',
    number: '#4c9a91',
    boolean: '#4d9375',
    comment: '#6e6e5e',
    function: '#80a665',
    variable: '#dbd7ca',
    parameter: '#b8a965',
    property: '#6394bf',
    operator: '#cb7676',
    punctuation: '#6e6e5e',
    class: '#6394bf',
    type: '#5da5a2',
    constant: '#de9a3e',
    tag: '#4d9375',
    attribute: '#b8a965',
    regex: '#c98a7d',
    inserted: '#4d9375',
    deleted: '#cb7676',
  },
  terminal: {
    bg: '#121212',
    fg: '#dbd7ca',
    cursor: '#dbd7ca',
    selection: '#2a2a2a',
    black: '#121212',
    red: '#cb7676',
    green: '#4d9375',
    yellow: '#e6cc77',
    blue: '#6394bf',
    magenta: '#d9739f',
    cyan: '#5da5a2',
    white: '#dbd7ca',
    brightBlack: '#6e6e5e',
    brightRed: '#cb7676',
    brightGreen: '#80a665',
    brightYellow: '#e6cc77',
    brightBlue: '#6893bf',
    brightMagenta: '#d9739f',
    brightCyan: '#5da5a2',
    brightWhite: '#dbd7ca',
  },
};

// -----------------------------------------------------------------------------
// Monochrome Theme
// -----------------------------------------------------------------------------
const monochromeTheme: ThemeColors = {
  bg: {
    base: '#000000',
    raised: '#0a0a0a',
    overlay: '#141414',
    elevated: '#1a1a1a',
  },
  fg: {
    default: '#ffffff',
    muted: '#b0b0b0',
    subtle: '#707070',
    disabled: '#404040',
  },
  accent: {
    default: '#ffffff',
    hover: '#e0e0e0',
    active: '#c0c0c0',
    subtle: '#ffffff15',
    fg: '#000000',
  },
  status: {
    success: '#ffffff',
    successSubtle: '#ffffff15',
    warning: '#c0c0c0',
    warningSubtle: '#c0c0c015',
    error: '#ffffff',
    errorSubtle: '#ffffff15',
    info: '#b0b0b0',
    infoSubtle: '#b0b0b015',
  },
  editor: {
    bg: '#000000',
    fg: '#ffffff',
    lineNumber: '#505050',
    lineNumberActive: '#909090',
    lineHighlight: '#101010',
    selection: '#303030',
    cursor: '#ffffff',
    matchingBracket: '#404040',
    findMatch: '#404040',
  },
  syntax: {
    keyword: '#ffffff',
    string: '#c0c0c0',
    number: '#e0e0e0',
    boolean: '#ffffff',
    comment: '#606060',
    function: '#ffffff',
    variable: '#e0e0e0',
    parameter: '#b0b0b0',
    property: '#d0d0d0',
    operator: '#909090',
    punctuation: '#808080',
    class: '#ffffff',
    type: '#d0d0d0',
    constant: '#e0e0e0',
    tag: '#ffffff',
    attribute: '#c0c0c0',
    regex: '#b0b0b0',
    inserted: '#ffffff',
    deleted: '#808080',
  },
  terminal: {
    bg: '#000000',
    fg: '#ffffff',
    cursor: '#ffffff',
    selection: '#303030',
    black: '#000000',
    red: '#ffffff',
    green: '#e0e0e0',
    yellow: '#d0d0d0',
    blue: '#c0c0c0',
    magenta: '#b0b0b0',
    cyan: '#a0a0a0',
    white: '#ffffff',
    brightBlack: '#505050',
    brightRed: '#ffffff',
    brightGreen: '#ffffff',
    brightYellow: '#e0e0e0',
    brightBlue: '#d0d0d0',
    brightMagenta: '#c0c0c0',
    brightCyan: '#b0b0b0',
    brightWhite: '#ffffff',
  },
};

// =============================================================================
// Theme Registry
// =============================================================================

export const themes: Record<ThemeId, ThemeColors> = {
  'light': lightTheme,
  'dark': darkTheme,
  'nord-light': nordLightTheme,
  'nord-dark': nordDarkTheme,
  'gruvbox-light': gruvboxLightTheme,
  'gruvbox-dark': gruvboxDarkTheme,
  'tokyonight': tokyonightTheme,
  'catppuccin': catppuccinTheme,
  'one-dark-pro': oneDarkProTheme,
  'material-light': materialLightTheme,
  'material-dark': materialDarkTheme,
  'material-darker': materialDarkerTheme,
  'material-palenight': materialPalenightTheme,
  'material-oceanic': materialOceanicTheme,
  'dracula': draculaTheme,
  'horizon': horizonTheme,
  'monokai': monokaiTheme,
  'synthwave-84': synthwave84Theme,
  'github-dark': githubDarkTheme,
  'github-light': githubLightTheme,
  'ayu-dark': ayuDarkTheme,
  'ayu-mirage': ayuMirageTheme,
  'ayu-light': ayuLightTheme,
  'solarized-dark': solarizedDarkTheme,
  'solarized-light': solarizedLightTheme,
  'rose-pine': rosePineTheme,
  'rose-pine-dawn': rosePineDawnTheme,
  'everforest-dark': everforestDarkTheme,
  'everforest-light': everforestLightTheme,
  'kanagawa': kanagawaTheme,
  'night-owl': nightOwlTheme,
  'vitesse-dark': vitesseDarkTheme,
  'monochrome': monochromeTheme,
};

export const themeLabels: Record<ThemeOption, string> = {
  'device': 'System',
  'light': 'Light',
  'dark': 'Dark',
  'nord-light': 'Nord Light',
  'nord-dark': 'Nord Dark',
  'gruvbox-light': 'Gruvbox Light',
  'gruvbox-dark': 'Gruvbox Dark',
  'tokyonight': 'Tokyo Night',
  'catppuccin': 'Catppuccin',
  'one-dark-pro': 'One Dark Pro',
  'material-light': 'Material Light',
  'material-dark': 'Material Dark',
  'material-darker': 'Material Darker',
  'material-palenight': 'Material Palenight',
  'material-oceanic': 'Material Oceanic',
  'dracula': 'Dracula',
  'horizon': 'Horizon',
  'monokai': 'Monokai',
  'synthwave-84': 'Synthwave 84',
  'github-dark': 'GitHub Dark',
  'github-light': 'GitHub Light',
  'ayu-dark': 'Ayu Dark',
  'ayu-mirage': 'Ayu Mirage',
  'ayu-light': 'Ayu Light',
  'solarized-dark': 'Solarized Dark',
  'solarized-light': 'Solarized Light',
  'rose-pine': 'Rosé Pine',
  'rose-pine-dawn': 'Rosé Pine Dawn',
  'everforest-dark': 'Everforest Dark',
  'everforest-light': 'Everforest Light',
  'kanagawa': 'Kanagawa',
  'night-owl': 'Night Owl',
  'vitesse-dark': 'Vitesse Dark',
  'monochrome': 'Monochrome',
};

export const themeDescriptions: Record<ThemeOption, string> = {
  'device': 'Follows your system appearance',
  'light': 'Clean and minimal light theme',
  'dark': 'Easy on the eyes dark theme',
  'nord-light': 'Arctic, north-bluish palette',
  'nord-dark': 'Arctic dark palette',
  'gruvbox-light': 'Retro groove with warm tones',
  'gruvbox-dark': 'Retro groove dark',
  'tokyonight': 'Inspired by Tokyo city lights',
  'catppuccin': 'Soothing pastel theme',
  'one-dark-pro': 'Atom One Dark inspired',
  'material-light': 'Material Design light',
  'material-dark': 'Material Design dark',
  'material-darker': 'Material Design darker',
  'material-palenight': 'Material Design palenight',
  'material-oceanic': 'Material Design oceanic',
  'dracula': 'Dark theme for vampires',
  'horizon': 'Warm dark theme',
  'monokai': 'Classic Sublime Text theme',
  'synthwave-84': 'Retro synthwave neon glow',
  'github-dark': 'GitHub official dark theme',
  'github-light': 'GitHub official light theme',
  'ayu-dark': 'Modern minimal dark',
  'ayu-mirage': 'Ayu with muted tones',
  'ayu-light': 'Modern minimal light',
  'solarized-dark': 'Ethan Schoonover classic dark',
  'solarized-light': 'Ethan Schoonover classic light',
  'rose-pine': 'Soho vibes with muted colors',
  'rose-pine-dawn': 'Rosé Pine light variant',
  'everforest-dark': 'Comfortable green-based dark',
  'everforest-light': 'Comfortable green-based light',
  'kanagawa': 'Inspired by Katsushika Hokusai',
  'night-owl': 'For night owls and low-light',
  'vitesse-dark': 'Anthony Fu minimal dark',
  'monochrome': 'Pure black and white',
};

// =============================================================================
// Utilities
// =============================================================================

export function isDarkTheme(themeId: ThemeId): boolean {
  return [
    'dark',
    'nord-dark',
    'gruvbox-dark',
    'tokyonight',
    'catppuccin',
    'one-dark-pro',
    'material-dark',
    'material-darker',
    'material-palenight',
    'material-oceanic',
    'dracula',
    'horizon',
    'monokai',
    'synthwave-84',
    'github-dark',
    'ayu-dark',
    'ayu-mirage',
    'solarized-dark',
    'rose-pine',
    'everforest-dark',
    'kanagawa',
    'night-owl',
    'vitesse-dark',
    'monochrome',
  ].includes(themeId);
}

export function getTheme(themeId: ThemeId): ThemeColors {
  return themes[themeId];
}

export function resolveDeviceTheme(colorScheme: 'light' | 'dark' | null | undefined): ThemeId {
  return colorScheme === 'dark' ? 'dark' : 'light';
}

export function isValidTheme(theme: string): theme is ThemeOption {
  return theme === 'device' || theme in themes;
}

// Get Prism token colors from theme
export function getPrismTokenColors(colors: ThemeColors): Record<string, string> {
  const { syntax, editor } = colors;
  return {
    'keyword': syntax.keyword,
    'string': syntax.string,
    'comment': syntax.comment,
    'function': syntax.function,
    'number': syntax.number,
    'operator': syntax.operator,
    'punctuation': syntax.punctuation,
    'class-name': syntax.class,
    'boolean': syntax.boolean,
    'property': syntax.property,
    'tag': syntax.tag,
    'attr-name': syntax.attribute,
    'attr-value': syntax.string,
    'builtin': syntax.type,
    'char': syntax.string,
    'constant': syntax.constant,
    'deleted': syntax.deleted,
    'doctype': syntax.comment,
    'entity': syntax.keyword,
    'important': syntax.keyword,
    'inserted': syntax.inserted,
    'namespace': syntax.type,
    'prolog': syntax.comment,
    'regex': syntax.regex,
    'selector': syntax.tag,
    'symbol': syntax.constant,
    'variable': syntax.variable,
    'parameter': syntax.parameter,
    'template-string': syntax.string,
    'template-punctuation': syntax.string,
    'interpolation-punctuation': syntax.keyword,
    'default': editor.fg,
  };
}
