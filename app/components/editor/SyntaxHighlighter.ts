// Syntax Highlighting Utilities
import { SupportedLanguage } from './types';

/**
 * Finds all matches for search functionality
 */
export function findAllMatches(
  code: string,
  searchText: string,
  options: { matchCase: boolean; useRegex: boolean; matchWholeWord: boolean }
): Array<{ start: number; end: number; line: number; column: number }> {
  if (!searchText) return [];

  const matches: Array<{ start: number; end: number; line: number; column: number }> = [];
  const lines = code.split('\n');
  let offset = 0;

  let pattern: RegExp;
  try {
    if (options.useRegex) {
      pattern = new RegExp(searchText, options.matchCase ? 'g' : 'gi');
    } else {
      const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const wordBoundary = options.matchWholeWord ? '\\b' : '';
      pattern = new RegExp(`${wordBoundary}${escaped}${wordBoundary}`, options.matchCase ? 'g' : 'gi');
    }
  } catch {
    return [];
  }

  lines.forEach((line, lineIndex) => {
    let match;
    while ((match = pattern.exec(line)) !== null) {
      matches.push({
        start: offset + match.index,
        end: offset + match.index + match[0].length,
        line: lineIndex,
        column: match.index,
      });
    }
    offset += line.length + 1; // +1 for newline
  });

  return matches;
}

/**
 * Detect language from file extension
 */
export function detectLanguage(fileName: string): SupportedLanguage {
  const ext = fileName.slice(fileName.lastIndexOf('.'));
  const langMap: Record<string, SupportedLanguage> = {
    '.js': 'javascript',
    '.jsx': 'jsx',
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.json': 'json',
    '.html': 'html',
    '.css': 'css',
    '.py': 'python',
  };
  return langMap[ext] || 'plaintext';
}


