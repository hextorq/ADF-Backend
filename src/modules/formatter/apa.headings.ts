import { HeadingInfo, HeadingLevel } from "./apa.types.js";

const MINOR_WORDS = new Set([
  "a", "an", "the",
  "and", "as", "but", "for", "if", "nor", "or", "so", "yet",
  "at", "by", "for", "in", "of", "off", "on", "per", "to", "up", "via"
]);

/**
 * Converts text into APA 7th Edition Title Case:
 * - Capitalize the first word, last word, and words with 4+ letters
 * - Capitalize words following a colon or dash
 * - Capitalize major hyphenated words (e.g., Self-Report)
 * - Lowercase conjunctions, articles, and short prepositions (<= 3 letters)
 */
export function toApaTitleCase(text: string): string {
  if (!text) return "";

  const trimmed = text.trim();
  // Split words preserving colons and dashes
  const words = trimmed.split(/\s+/);

  return words
    .map((word, index) => {
      // Check if preceded by colon/em-dash
      const prevWord = index > 0 ? words[index - 1] : "";
      const isFirst = index === 0;
      const isLast = index === words.length - 1;
      const followsPunctuation = prevWord.endsWith(":") || prevWord.endsWith("—") || prevWord.endsWith("-");

      // Handle hyphenated compound words like "Post-Traumatic" or "Self-Report"
      if (word.includes("-") && !word.startsWith("-") && !word.endsWith("-")) {
        return word
          .split("-")
          .map((sub, sIdx) => {
            const lower = sub.toLowerCase();
            if (sIdx === 0 || !MINOR_WORDS.has(lower) || sub.length >= 4) {
              return capitalizeFirst(sub);
            }
            return lower;
          })
          .join("-");
      }

      // Strip punctuation to inspect root word
      const cleanWord = word.replace(/^[^\w]+|[^\w]+$/g, "");
      const lower = cleanWord.toLowerCase();

      // Check if Roman numeral (e.g. IV, VII) or acronym (e.g. APA, ADF, ADHD)
      if (/^(I|II|III|IV|V|VI|VII|VIII|IX|X|[A-Z]{2,})$/.test(cleanWord)) {
        return word; // preserve uppercase acronym or numeral
      }

      if (isFirst || isLast || followsPunctuation || cleanWord.length >= 4 || !MINOR_WORDS.has(lower)) {
        return replaceFirstLetterWithCapital(word);
      }

      // Otherwise lowercase minor word
      return word.toLowerCase();
    })
    .join(" ");
}

function capitalizeFirst(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function replaceFirstLetterWithCapital(word: string): string {
  return word.replace(/[a-zA-Z]/, (c) => c.toUpperCase());
}

// Major APA Level 1 Section Headings
const LEVEL_1_KEYWORDS = new Set([
  "abstract",
  "introduction",
  "literature review",
  "literature survey",
  "related work",
  "method",
  "methods",
  "methodology",
  "materials and methods",
  "results",
  "findings",
  "discussion",
  "results and discussion",
  "conclusion",
  "conclusions",
  "general discussion",
  "references",
  "bibliography",
  "appendix",
  "appendices",
  "acknowledgement",
  "acknowledgements",
  "declaration of interest",
  "declaration of interest statement",
  "funding",
  "fundings",
  "author note",
]);

// Typical Level 2 Sub-Headings
const LEVEL_2_KEYWORDS = new Set([
  "participants",
  "sample",
  "materials",
  "measures",
  "procedure",
  "research design",
  "data collection",
  "data analysis",
  "theoretical framework",
  "theoretical perspective",
  "hypotheses",
  "hypothesis",
  "objectives",
  "research problem",
  "scope of the study",
  "significance of the study",
  "implications",
  "limitations",
  "delimitations",
  "future research",
  "practical implications",
  "theoretical implications",
  "qualitative analysis",
  "quantitative analysis",
]);

/**
 * Detects whether a paragraph is an APA heading (Levels 1 to 5),
 * its level, confidence, and whether it represents a run-in heading (Levels 4 and 5).
 */
export function classifyHeading(
  paragraphText: string,
  htmlElement?: string,
  isBold?: boolean,
  isItalic?: boolean,
  isIndented?: boolean
): HeadingInfo | null {
  const text = paragraphText.trim();
  if (!text || text.length < 2) return null;

  // Filter out tables, figures, list items, citations, and standard prose
  if (/^(table|figure|fig\.)\s+\d+/i.test(text)) return null;
  if (/^[•\-\*–—\u2022]\s+/.test(text)) return null;
  if (text.startsWith("(") && text.endsWith(")")) return null;

  // 1. Detect Explicit HTML Heading Tags (from mammoth or docx)
  if (htmlElement) {
    const hMatch = htmlElement.toLowerCase().match(/^h([1-5])$/);
    if (hMatch) {
      const level = parseInt(hMatch[1], 10) as HeadingLevel;
      return {
        level,
        text: toApaTitleCase(text),
        originalText: text,
        isRunIn: level >= 4,
        confidence: "high",
        reason: `Explicit <h${level}> heading tag detected`,
      };
    }
  }

  // 2. Numbered Heading Detection (e.g., "1. Introduction", "2.1 Participants", "2.1.1 Measures", "2.1.1.1 Scale A.", "2.1.1.1.1 Item 1.")
  const numberedMatch = text.match(/^(\d+(?:\.\d+)*)\.?\s+(.+)$/);
  if (numberedMatch) {
    const numPrefix = numberedMatch[1];
    const content = numberedMatch[2].trim();

    // Check if content is not a regular sentence (> 100 chars without being a run-in)
    if (content.length > 120 && !content.includes(".")) {
      return null;
    }

    const dotCount = (numPrefix.match(/\./g) || []).length;
    let level: HeadingLevel = (Math.min(dotCount + 1, 5)) as HeadingLevel;

    // Check for run-in heading (e.g. "1.1.1.1 Demographics. The sample consisted of...")
    let isRunIn = false;
    let headingTitle = content;
    let runInText: string | undefined;

    if (level >= 4) {
      const dotIndex = content.indexOf(".");
      if (dotIndex !== -1 && dotIndex < 50 && dotIndex < content.length - 2) {
        headingTitle = content.substring(0, dotIndex + 1);
        runInText = content.substring(dotIndex + 1).trim();
        isRunIn = true;
      }
    }

    return {
      level,
      text: toApaTitleCase(headingTitle),
      originalText: text,
      isRunIn,
      runInText,
      confidence: "high",
      reason: `Numbered academic heading detected (${numPrefix}) mapped to APA Level ${level}`,
    };
  }

  // 3. Known Standard Level 1 Section Headings
  const cleanLower = text.toLowerCase().replace(/[:.]\s*$/, "");
  if (LEVEL_1_KEYWORDS.has(cleanLower)) {
    return {
      level: 1,
      text: toApaTitleCase(text.replace(/[:.]\s*$/, "")),
      originalText: text,
      isRunIn: false,
      confidence: "high",
      reason: `Standard major academic section heading "${text}"`,
    };
  }

  // 4. Known Standard Level 2 Subheadings
  if (LEVEL_2_KEYWORDS.has(cleanLower)) {
    return {
      level: 2,
      text: toApaTitleCase(text.replace(/[:.]\s*$/, "")),
      originalText: text,
      isRunIn: false,
      confidence: "high",
      reason: `Standard academic subsection heading "${text}"`,
    };
  }

  // 5. Detect Run-in Headings (Level 4 & Level 5) in Paragraph text
  // e.g. "Participant Characteristics. The study involved..." or "Sample Size. Total of 400..."
  // When formatted bold / italic at the start of an indented paragraph
  const runInMatch = text.match(/^([A-Z][A-Za-z0-9\s,'’\-]{2,55}\.)\s+([A-Z].+)$/);
  if (runInMatch && (isBold || isIndented)) {
    const leadPhrase = runInMatch[1];
    const bodyText = runInMatch[2];

    // Verify lead phrase doesn't look like normal prose
    const leadWords = leadPhrase.split(/\s+/).length;
    if (leadWords <= 9 && !/^(However|Therefore|Moreover|Furthermore|In addition|Specifically|For example)\b/i.test(leadPhrase)) {
      const level: HeadingLevel = isItalic ? 5 : 4;
      return {
        level,
        text: toApaTitleCase(leadPhrase),
        originalText: leadPhrase,
        isRunIn: true,
        runInText: bodyText,
        confidence: isBold ? "high" : "medium",
        reason: `APA Level ${level} run-in heading identified with trailing body text`,
      };
    }
  }

  // 6. Bold/Short Standalone Lines (under 80 chars)
  if (isBold && text.length <= 80 && !text.endsWith(".")) {
    const level: HeadingLevel = isItalic ? 3 : 2;
    return {
      level,
      text: toApaTitleCase(text),
      originalText: text,
      isRunIn: false,
      confidence: text.length <= 50 ? "high" : "medium",
      reason: `Standalone bold phrase detected as Level ${level} heading`,
    };
  }

  return null;
}
