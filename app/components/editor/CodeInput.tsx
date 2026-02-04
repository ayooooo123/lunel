// CodeInput - Code editor with inline syntax highlighting
import { ThemeColors } from "@/constants/themes";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-json";
import "prismjs/components/prism-css";
import "prismjs/components/prism-python";
import "prismjs/components/prism-markup";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputSelectionChangeEventData,
  View,
} from "react-native";
import {
  CursorPosition,
  EditorConfig,
  SupportedLanguage,
} from "./types";

const CODE_FONT_FAMILY = Platform.select({
  ios: "JetBrainsMono_400Regular",
  android: "JetBrainsMono_400Regular",
  default: "monospace",
});

const getPrismLanguage = (language: SupportedLanguage): string => {
  const mapping: Record<SupportedLanguage, string> = {
    javascript: "javascript",
    typescript: "typescript",
    jsx: "jsx",
    tsx: "tsx",
    json: "json",
    html: "markup",
    css: "css",
    python: "python",
    plaintext: "plaintext",
  };
  return mapping[language] || "plaintext";
};

const buildTokenColors = (colors: ThemeColors): Record<string, string> => {
  const { syntax, editor } = colors;
  return {
    keyword: syntax.keyword,
    string: syntax.string,
    comment: syntax.comment,
    function: syntax.function,
    number: syntax.number,
    operator: syntax.operator,
    punctuation: syntax.punctuation,
    "class-name": syntax.class,
    boolean: syntax.boolean,
    property: syntax.property,
    tag: syntax.tag,
    "attr-name": syntax.attribute,
    "attr-value": syntax.string,
    builtin: syntax.type,
    char: syntax.string,
    constant: syntax.constant,
    deleted: syntax.deleted,
    doctype: syntax.comment,
    entity: syntax.keyword,
    important: syntax.keyword,
    inserted: syntax.inserted,
    namespace: syntax.type,
    prolog: syntax.comment,
    regex: syntax.regex,
    selector: syntax.tag,
    symbol: syntax.constant,
    variable: syntax.variable,
    parameter: syntax.parameter,
    "template-string": syntax.string,
    "template-punctuation": syntax.string,
    "interpolation-punctuation": syntax.keyword,
    default: editor.fg,
  };
};

export interface CodeInputHandle {
  getContent: () => string;
  setContent: (content: string) => void;
  getCursorPosition: () => CursorPosition;
  focus: () => void;
  blur: () => void;
}

interface CodeInputProps {
  initialContent: string;
  language: SupportedLanguage;
  colors: ThemeColors;
  config: EditorConfig;
  onContentChange?: (content: string) => void;
  onCursorChange?: (position: CursorPosition) => void;
}

const CodeInput = forwardRef<CodeInputHandle, CodeInputProps>(function CodeInput(
  { initialContent, language, colors, config, onContentChange, onCursorChange },
  ref
) {
  const textInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const lineNumberScrollRef = useRef<ScrollView>(null);

  // Content state for syntax highlighting display
  const [content, setContent] = useState(initialContent);
  const [currentLine, setCurrentLine] = useState(0);

  // Refs for non-render data
  const cursorRef = useRef<CursorPosition>({ line: 0, column: 0 });
  const selectionRef = useRef({ start: 0, end: 0 });

  const lineHeightPx = config.fontSize * config.lineHeight;
  const tokenColors = useMemo(() => buildTokenColors(colors), [colors]);
  const prismLang = useMemo(() => getPrismLanguage(language), [language]);

  // Imperative API
  useImperativeHandle(ref, () => ({
    getContent: () => content,
    setContent: (newContent: string) => {
      setContent(newContent);
    },
    getCursorPosition: () => cursorRef.current,
    focus: () => textInputRef.current?.focus(),
    blur: () => textInputRef.current?.blur(),
  }));

  // Tokenize and render as Text elements
  const renderHighlightedContent = useMemo(() => {
    if (!content) return null;

    try {
      const grammar = Prism.languages[prismLang];
      const tokens = grammar ? Prism.tokenize(content, grammar) : [content];

      return tokens.map((token, i) => {
        if (typeof token === "string") {
          return (
            <Text key={i} style={{ color: tokenColors.default }}>
              {token}
            </Text>
          );
        }

        const tokenType = Array.isArray(token.type) ? token.type[0] : token.type;
        const color = tokenColors[tokenType] || tokenColors.default;
        const tokenContent = typeof token.content === "string"
          ? token.content
          : String(token.content);

        return (
          <Text key={i} style={{ color }}>
            {tokenContent}
          </Text>
        );
      });
    } catch {
      return (
        <Text style={{ color: tokenColors.default }}>
          {content}
        </Text>
      );
    }
  }, [content, prismLang, tokenColors]);

  const lines = useMemo(() => content.split("\n"), [content]);

  // Handle text changes
  const handleTextChange = useCallback(
    (text: string) => {
      setContent(text);
      onContentChange?.(text);
    },
    [onContentChange]
  );

  // Handle selection/cursor changes
  const handleSelectionChange = useCallback(
    (event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      const { start, end } = event.nativeEvent.selection;
      selectionRef.current = { start, end };

      // Calculate line/column
      let line = 0;
      let charCount = 0;
      const contentLines = content.split("\n");

      for (let i = 0; i < contentLines.length; i++) {
        const lineLength = contentLines[i].length + 1;
        if (charCount + lineLength > start) {
          line = i;
          break;
        }
        charCount += lineLength;
      }

      const column = start - charCount;
      cursorRef.current = { line, column };

      if (line !== currentLine) {
        setCurrentLine(line);
      }

      onCursorChange?.({ line, column });
    },
    [content, currentLine, onCursorChange]
  );

  // Sync scroll
  const handleScroll = useCallback((event: any) => {
    const { y } = event.nativeEvent.contentOffset;
    lineNumberScrollRef.current?.scrollTo({ y, animated: false });
  }, []);

  // Line numbers
  const lineNumbers = useMemo(() => {
    return lines.map((_, index) => {
      const isCurrentLine = index === currentLine;
      return (
        <View
          key={index}
          style={[
            styles.lineNumberRow,
            {
              height: lineHeightPx,
              backgroundColor:
                isCurrentLine && config.highlightCurrentLine
                  ? colors.editor.lineHighlight
                  : "transparent",
            },
          ]}
        >
          <Text
            style={[
              styles.lineNumber,
              {
                color: isCurrentLine
                  ? colors.editor.lineNumberActive
                  : colors.editor.lineNumber,
                fontSize: config.fontSize,
                lineHeight: lineHeightPx,
              },
            ]}
          >
            {index + 1}
          </Text>
        </View>
      );
    });
  }, [lines.length, currentLine, config, lineHeightPx, colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.editor.bg }]}>
      {/* Line numbers gutter */}
      {config.showLineNumbers && (
        <View style={styles.lineNumberGutter}>
          <ScrollView
            ref={lineNumberScrollRef}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
            bounces={false}
          >
            {lineNumbers}
          </ScrollView>
        </View>
      )}

      {/* Editor area */}
      <View style={styles.editorArea}>
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              ref={textInputRef}
              style={[
                styles.textInput,
                {
                  fontFamily: CODE_FONT_FAMILY,
                  fontSize: config.fontSize,
                  lineHeight: lineHeightPx,
                  color: tokenColors.default,
                  minWidth: 2000,
                },
              ]}
              onChangeText={handleTextChange}
              onSelectionChange={handleSelectionChange}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              spellCheck={false}
              keyboardType="ascii-capable"
              textAlignVertical="top"
              scrollEnabled={false}
              selectionColor={colors.editor.selection}
              cursorColor={colors.editor.cursor}
            >
              {renderHighlightedContent}
            </TextInput>
          </ScrollView>
        </ScrollView>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  lineNumberGutter: {
    width: 44,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "rgba(128, 128, 128, 0.3)",
  },
  lineNumberRow: {
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 8,
  },
  lineNumber: {
    fontFamily: CODE_FONT_FAMILY,
    textAlign: "right",
  },
  editorArea: {
    flex: 1,
  },
  textInput: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 8,
    paddingRight: 16,
    margin: 0,
    textAlignVertical: "top",
    backgroundColor: "transparent",
  },
});

export default CodeInput;
