import { MonoFamilyId, ThemeColors } from "@/contexts/ThemeContext";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { EditorConfig } from "./types";

// Map mono font IDs to Google Fonts names and CSS font-family
const MONO_FONT_CONFIG: Record<
  MonoFamilyId,
  { googleName: string; cssFamily: string }
> = {
  "jetbrains-mono": {
    googleName: "JetBrains+Mono",
    cssFamily: "'JetBrains Mono', monospace",
  },
  "fira-code": { googleName: "Fira+Code", cssFamily: "'Fira Code', monospace" },
  "source-code-pro": {
    googleName: "Source+Code+Pro",
    cssFamily: "'Source Code Pro', monospace",
  },
  "ibm-plex-mono": {
    googleName: "IBM+Plex+Mono",
    cssFamily: "'IBM Plex Mono', monospace",
  },
  "dm-mono": { googleName: "DM+Mono", cssFamily: "'DM Mono', monospace" },
};

interface CodeMirrorEditorProps {
  initialContent: string;
  language: string;
  colors: ThemeColors;
  isDark?: boolean;
  config?: Partial<EditorConfig>;
  monoFont?: MonoFamilyId;
  onChange?: (content: string) => void;
}

export interface CodeMirrorEditorHandle {
  setContent: (content: string) => void;
  getContent: () => string;
  setLanguage: (language: string) => void;
  focus: () => void;
}

interface EditorOptions {
  fontSize: number;
  tabSize: number;
  lineHeight: number;
  wordWrap: boolean;
  showLineNumbers: boolean;
  highlightCurrentLine: boolean;
}

const DEFAULT_OPTIONS: EditorOptions = {
  fontSize: 14,
  tabSize: 2,
  lineHeight: 1.5,
  wordWrap: true,
  showLineNumbers: true,
  highlightCurrentLine: true,
};

function escapeForJS(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');
}

function generateHTML(
  colors: ThemeColors,
  isDark: boolean,
  options: EditorOptions,
  fontConfig: { googleName: string; cssFamily: string },
  initialContent: string
): string {
  const escapedContent = escapeForJS(initialContent);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=${
    fontConfig.googleName
  }:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      /* Editor colors */
      --editor-bg: ${colors.editor.bg};
      --editor-fg: ${colors.editor.fg};
      --editor-cursor: ${colors.editor.cursor};
      --editor-selection: ${colors.editor.selection};
      --editor-line-number: ${colors.editor.lineNumber};
      --editor-line-number-active: ${colors.editor.lineNumberActive};
      --editor-line-highlight: ${colors.editor.lineHighlight};
      --editor-matching-bracket: ${colors.editor.matchingBracket};
      --bg-overlay: ${colors.bg.overlay};
      --accent-default: ${colors.accent.default};

      /* Syntax colors */
      --syntax-comment: ${colors.syntax.comment};
      --syntax-keyword: ${colors.syntax.keyword};
      --syntax-variable: ${colors.syntax.variable};
      --syntax-string: ${colors.syntax.string};
      --syntax-number: ${colors.syntax.number};
      --syntax-class: ${colors.syntax.class};
      --syntax-property: ${colors.syntax.property};
      --syntax-boolean: ${colors.syntax.boolean};
      --syntax-regex: ${colors.syntax.regex};
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; overflow: hidden; background: var(--editor-bg); }
    #editor { height: 100%; padding-top: 4px; }

    /* Editor theme using CSS variables */
    .cm-editor { height: 100%; background-color: var(--editor-bg); color: var(--editor-fg); }
    .cm-editor .cm-content {
      font-family: ${fontConfig.cssFamily};
      font-size: ${options.fontSize}px;
      line-height: ${options.lineHeight};
      caret-color: var(--editor-cursor);
    }
    .cm-editor.cm-focused { outline: none; }
    .cm-editor.cm-focused .cm-cursor { border-left-color: var(--editor-cursor); border-left-width: 2px; }
    .cm-editor .cm-selectionBackground,
    .cm-editor.cm-focused .cm-selectionBackground,
    .cm-editor ::selection { background-color: var(--editor-selection); }
    .cm-editor .cm-gutters {
      background-color: var(--editor-bg);
      color: var(--editor-line-number);
      border: none;
      border-right: 1px solid var(--bg-overlay);
      display: ${options.showLineNumbers ? "flex" : "none"};
    }
    .cm-editor .cm-activeLineGutter {
      background-color: ${
        options.highlightCurrentLine
          ? "var(--editor-line-highlight)"
          : "transparent"
      };
      color: var(--editor-line-number-active);
    }
    .cm-editor .cm-activeLine {
      background-color: ${
        options.highlightCurrentLine
          ? "var(--editor-line-highlight)"
          : "transparent"
      };
    }
    .cm-editor .cm-matchingBracket {
      background-color: var(--editor-matching-bracket);
      outline: 1px solid var(--accent-default);
    }
    .cm-editor .cm-scroller { font-family: ${fontConfig.cssFamily}; }

    /* Syntax highlighting using CodeMirror's generated classes */
    .ͼm { color: var(--syntax-comment); font-style: italic; }  /* comments */
    .ͼb { color: var(--syntax-keyword); }                       /* keywords */
    .ͼg { color: var(--syntax-variable); }                      /* variables */
    .ͼe { color: var(--syntax-string); }                        /* strings */
    .ͼd { color: var(--syntax-number); }                        /* numbers */
    .ͼj { color: var(--syntax-class); }                         /* class names */
    .ͼl { color: var(--syntax-property); }                      /* properties */
    .ͼc { color: var(--syntax-boolean); }                       /* super, true, false */
    .ͼf { color: var(--syntax-regex); }                         /* regex, template literals */
  </style>
</head>
<body>
  <div id="editor"></div>

  <script type="module">
    const {EditorView, basicSetup} = await import('https://esm.sh/codemirror@6.0.1');
    const {javascript} = await import('https://esm.sh/@codemirror/lang-javascript@6.2.2');

    // Debounce function for content change notifications
    let debounceTimer = null;
    const debounceDelay = 300;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const content = update.state.doc.toString();
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'contentChange',
            content: content
          }));
        }, debounceDelay);
      }
    });

    const view = new EditorView({
      doc: \`${escapedContent}\`,
      extensions: [
        basicSetup,
        javascript(),
        updateListener,
        ${options.wordWrap ? "EditorView.lineWrapping," : ""}
      ],
      parent: document.getElementById('editor')
    });

    window.editorView = view;

    // Function to set editor content from React Native
    window.setEditorContent = function(content) {
      const currentContent = view.state.doc.toString();
      if (currentContent !== content) {
        view.dispatch({
          changes: { from: 0, to: currentContent.length, insert: content }
        });
      }
    };

    // Function to get current editor content
    window.getEditorContent = function() {
      return view.state.doc.toString();
    };

    // Focus function
    window.focusEditor = function() {
      view.focus();
    };

    // Function to update theme colors without reloading
    window.updateThemeColors = function(colors) {
      const root = document.documentElement;
      root.style.setProperty('--editor-bg', colors.editor.bg);
      root.style.setProperty('--editor-fg', colors.editor.fg);
      root.style.setProperty('--editor-cursor', colors.editor.cursor);
      root.style.setProperty('--editor-selection', colors.editor.selection);
      root.style.setProperty('--editor-line-number', colors.editor.lineNumber);
      root.style.setProperty('--editor-line-number-active', colors.editor.lineNumberActive);
      root.style.setProperty('--editor-line-highlight', colors.editor.lineHighlight);
      root.style.setProperty('--editor-matching-bracket', colors.editor.matchingBracket);
      root.style.setProperty('--bg-overlay', colors.bg.overlay);
      root.style.setProperty('--accent-default', colors.accent.default);
      root.style.setProperty('--syntax-comment', colors.syntax.comment);
      root.style.setProperty('--syntax-keyword', colors.syntax.keyword);
      root.style.setProperty('--syntax-variable', colors.syntax.variable);
      root.style.setProperty('--syntax-string', colors.syntax.string);
      root.style.setProperty('--syntax-number', colors.syntax.number);
      root.style.setProperty('--syntax-class', colors.syntax.class);
      root.style.setProperty('--syntax-property', colors.syntax.property);
      root.style.setProperty('--syntax-boolean', colors.syntax.boolean);
      root.style.setProperty('--syntax-regex', colors.syntax.regex);
      document.body.style.background = colors.editor.bg;
    };
  </script>
</body>
</html>`;
}

const CodeMirrorEditor = forwardRef<
  CodeMirrorEditorHandle,
  CodeMirrorEditorProps
>(
  (
    {
      initialContent,
      language,
      colors,
      isDark = false,
      config,
      monoFont = "jetbrains-mono",
      onChange,
    },
    ref
  ) => {
    const webViewRef = useRef<WebView>(null);
    const contentRef = useRef(initialContent);
    const onChangeRef = useRef(onChange);
    const isReadyRef = useRef(false);

    // Keep onChange ref updated
    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    const options: EditorOptions = useMemo(
      () => ({
        ...DEFAULT_OPTIONS,
        ...config,
      }),
      [config]
    );

    const fontConfig = MONO_FONT_CONFIG[monoFont];

    // Only regenerate HTML on initial mount or font change
    const html = useMemo(
      () => generateHTML(colors, isDark, options, fontConfig, initialContent),
      [fontConfig, options, initialContent]
    );

    // Update colors via JS injection when theme changes (no reload needed)
    useEffect(() => {
      if (webViewRef.current && isReadyRef.current) {
        const colorsJson = JSON.stringify({
          editor: colors.editor,
          bg: { overlay: colors.bg.overlay },
          accent: { default: colors.accent.default },
          syntax: colors.syntax,
        });
        webViewRef.current.injectJavaScript(`
          if (window.updateThemeColors) {
            window.updateThemeColors(${colorsJson});
          }
          true;
        `);
      }
    }, [colors]);

    // Handle messages from WebView
    const handleMessage = useCallback((event: { nativeEvent: { data: string } }) => {
      try {
        const message = JSON.parse(event.nativeEvent.data);
        if (message.type === 'contentChange') {
          contentRef.current = message.content;
          if (onChangeRef.current) {
            onChangeRef.current(message.content);
          }
        }
      } catch (e) {
        console.error('Failed to parse WebView message:', e);
      }
    }, []);

    // Mark WebView as ready when loaded
    const handleLoad = useCallback(() => {
      isReadyRef.current = true;
    }, []);

    useImperativeHandle(ref, () => ({
      setContent: (content: string) => {
        contentRef.current = content;
        if (webViewRef.current && isReadyRef.current) {
          const escaped = content.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
          webViewRef.current.injectJavaScript(`
            if (window.setEditorContent) {
              window.setEditorContent('${escaped}');
            }
            true;
          `);
        }
      },
      getContent: () => contentRef.current,
      setLanguage: (lang: string) => {},
      focus: () => {
        if (webViewRef.current && isReadyRef.current) {
          webViewRef.current.injectJavaScript(`
            if (window.focusEditor) {
              window.focusEditor();
            }
            true;
          `);
        }
      },
    }));

    return (
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{ html }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          originWhitelist={["*"]}
          scrollEnabled={false}
          keyboardDisplayRequiresUserAction={false}
          hideKeyboardAccessoryView={true}
          automaticallyAdjustContentInsets={false}
          startInLoadingState={false}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          onMessage={handleMessage}
          onLoad={handleLoad}
          onError={(e) => console.error("WebView error:", e.nativeEvent)}
          onHttpError={(e) =>
            console.error("WebView HTTP error:", e.nativeEvent)
          }
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
});

export default CodeMirrorEditor;
