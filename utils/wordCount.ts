// Helper to strip Markdown syntax for word counting
const stripMarkdown = (text: string): string => {
  return text
    // Remove headers
    .replace(/^#+\s+/gm, '')
    // Remove bold/italic
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove strikethrough
    .replace(/~~(.*?)~~/g, '$1')
    // Remove links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images ![alt](url) -> ''
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove blockquotes
    .replace(/^\s*>\s+/gm, '')
    // Remove lists
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove horizontal rules
    .replace(/^\s*[-*_]{3,}\s*$/gm, '');
};

export interface NoteStats {
  characters: number;
  words: number;
  lines: number;
  readTime: number; // in minutes
}

export const getNoteStats = (text: string): NoteStats => {
  if (!text) return { characters: 0, words: 0, lines: 0, readTime: 0 };

  // 1. Line count (based on raw text)
  const lines = text.split(/\r\n|\r|\n/).length;

  // 2. Strip Markdown syntax to count only actual content
  const cleanText = stripMarkdown(text);

  // 3. Character Count (Hello -> 5, including punctuation and spaces in content)
  // We use the length of the cleaned text. 
  // If we want to exclude newlines from character count, we could do cleanText.replace(/\n/g, '').length
  // But usually "Character Count" includes all content characters. 
  // However, Typora's "Character Count" often refers to "Characters (no spaces)" or "Characters (with spaces)".
  // Given "Hello" = 5 (which has no space), and "标点也算上去", let's use the full length of cleanText.
  // NOTE: cleanText might have extra newlines from stripped blocks.
  // For better accuracy, maybe we should collapse multiple newlines? 
  // But let's stick to simple length first.
  const characters = cleanText.length;

  // 4. Word Count Logic (CJK = 1, Western = word)
  // Pattern to match CJK (Chinese, Japanese, Korean) characters
  const cjkRegex = /[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g;
  
  // Count CJK characters (1 char = 1 word)
  const cjkCount = (cleanText.match(cjkRegex) || []).length;

  // Handle Western words
  // Replace CJK characters with space to separate potential adjacent western words
  const textWithoutCjk = cleanText.replace(cjkRegex, ' ');
  
  // Match sequences of Latin/Number characters
  const westernWordRegex = /[a-zA-Z0-9_\u00C0-\u00FF]+(?:[-'][a-zA-Z0-9_\u00C0-\u00FF]+)*/g;
  
  const westernWords = textWithoutCjk.match(westernWordRegex) || [];
  
  const words = cjkCount + westernWords.length;
  
  // 5. Reading Time Calculation
  // Standard average reading speed is often cited around 200-250 words per minute.
  // We'll use 200 words/min as a conservative estimate.
  // For CJK, characters are often counted directly. 
  // We can just use the total 'words' count which includes CJK chars + Western words.
  const wordsPerMinute = 200;
  const readTime = Math.max(1, Math.ceil(words / wordsPerMinute));

  return {
    characters,
    words,
    lines,
    readTime
  };
};

// Backward compatibility or convenience
export const getWordCount = (text: string): number => {
  return getNoteStats(text).words;
};
