import { InTextCitation, ParsedReference } from "./apa.types.js";

/**
 * Extracts both parenthetical and narrative in-text citations from manuscript body text.
 */
export function extractApaCitations(text: string): InTextCitation[] {
  const citations: InTextCitation[] = [];
  const seen = new Set<string>();

  // 1. Multiple citations inside parentheses: (Smith, 2020; Jones et al., 2021; Williams & Brown, 2019)
  const multiParenRegex = /\(([^)]+;\s*[^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = multiParenRegex.exec(text)) !== null) {
    const inner = match[1];
    const parts = inner.split(/\s*;\s*/);
    for (const part of parts) {
      const citMatch = part.match(
        /^([A-Z][A-Za-z'’\-]+(?:\s+et\s+al\.?|\s*&\s*[A-Z][A-Za-z'’\-]+|\s+and\s+[A-Z][A-Za-z'’\-]+)*),\s*(\d{4}[a-z]?)(?:,\s*(?:pp?\.?\s*\d+(?:[\u2013-]\d+)?|para\.?\s*\d+))?/i
      );
      if (citMatch) {
        const raw = `(${citMatch[0]})`;
        if (!seen.has(raw)) {
          seen.add(raw);
          citations.push({
            raw,
            author: citMatch[1].trim(),
            year: citMatch[2].trim(),
            isNarrative: false,
            isEtAl: /\bet\s+al\b/i.test(citMatch[1]),
            pageLocator: extractPageLocator(part),
          });
        }
      }
    }
  }

  // 2. Single parenthetical citation: (Smith, 2020) or (Smith & Jones, 2020, p. 15) or (Smith et al., 2020)
  const singleParenRegex = /\(([A-Z][A-Za-z'’\-]+(?:\s+et\s+al\.?|\s*&\s*[A-Z][A-Za-z'’\-]+|\s+and\s+[A-Z][A-Za-z'’\-]+|\s*,\s*[A-Z][A-Za-z'’\-]+)*),\s*(\d{4}[a-z]?)(?:,\s*(?:pp?\.?\s*\d+(?:[\u2013-]\d+)?|para\.?\s*\d+))?\)/g;
  while ((match = singleParenRegex.exec(text)) !== null) {
    const raw = match[0];
    if (!seen.has(raw)) {
      seen.add(raw);
      citations.push({
        raw,
        author: match[1].trim(),
        year: match[2].trim(),
        isNarrative: false,
        isEtAl: /\bet\s+al\b/i.test(match[1]),
        pageLocator: extractPageLocator(raw),
      });
    }
  }

  // 3. Group author citations with bracketed abbreviations: (American Psychological Association [APA], 2020)
  const groupAuthorParenRegex = /\(([A-Za-z\s]+)\s*\[([A-Z]{2,8})\]\s*,\s*(\d{4}[a-z]?)\)/g;
  while ((match = groupAuthorParenRegex.exec(text)) !== null) {
    const raw = match[0];
    if (!seen.has(raw)) {
      seen.add(raw);
      citations.push({
        raw,
        author: match[1].trim(),
        year: match[3].trim(),
        isNarrative: false,
        isEtAl: false,
      });
    }
  }

  // 4. Narrative citations: Smith (2020), Smith and Jones (2020), Smith et al. (2020)
  const narrativeRegex = /\b([A-Z][A-Za-z'’\-]+(?:\s+et\s+al\.?|\s*&\s*[A-Z][A-Za-z'’\-]+|\s+and\s+[A-Z][A-Za-z'’\-]+)*)\s*\(\s*(\d{4}[a-z]?)(?:,\s*(?:pp?\.?\s*\d+(?:[\u2013-]\d+)?|para\.?\s*\d+))?\s*\)/g;
  while ((match = narrativeRegex.exec(text)) !== null) {
    const lead = match[1].trim();
    // Exclude false positives like "Table (2020)", "Figure (2020)", "ADF (2020)"
    if (!/^(figure|table|eq|equation|chapter|section|volume|vol|no|page|p|pp|adf|et\s+al)\b/i.test(lead)) {
      const raw = match[0];
      if (!seen.has(raw)) {
        seen.add(raw);
        citations.push({
          raw,
          author: lead,
          year: match[2].trim(),
          isNarrative: true,
          isEtAl: /\bet\s+al\b/i.test(lead),
          pageLocator: extractPageLocator(raw),
        });
      }
    }
  }

  return citations;
}

function extractPageLocator(citStr: string): string | undefined {
  const m = citStr.match(/(?:pp?\.?\s*\d+(?:[\u2013-]\d+)?|para\.?\s*\d+)/i);
  return m ? m[0] : undefined;
}

/**
 * Normalizes an author name for cross-matching (extracting primary surname).
 */
function extractPrimarySurname(authorStr: string): string {
  // Strip "et al.", "&", "and", initials
  const cleaned = authorStr
    .replace(/\bet\s+al\.?/gi, "")
    .replace(/[&,]/g, " ")
    .replace(/\band\b/gi, " ")
    .trim();

  const tokens = cleaned.split(/\s+/).filter(Boolean);
  return tokens[0] ? tokens[0].toLowerCase() : "";
}

/**
 * Validates in-text citations against the reference list.
 * Identifies:
 * - Uncited references (in list but never cited in text)
 * - Missing references (cited in text but missing in reference list)
 * - Inconsistent author names or years
 */
export function validateCitationsAndReferences(
  citations: InTextCitation[],
  references: ParsedReference[]
): {
  missingReferences: string[]; // Citations lacking a matching reference
  uncitedReferences: string[]; // References never cited in text
  authorYearMismatches: string[];
} {
  const missingReferences: string[] = [];
  const uncitedReferences: string[] = [];
  const authorYearMismatches: string[] = [];

  // Match Citations -> References
  citations.forEach((cit) => {
    const citSurname = extractPrimarySurname(cit.author);
    const citYear = cit.year;

    const matchedRef = references.find((ref) => {
      const refText = ref.raw.toLowerCase();
      const hasSurname = refText.includes(citSurname);
      const hasYear = ref.year === citYear || refText.includes(citYear) || (citYear === "n.d." && refText.includes("n.d."));
      return hasSurname && hasYear;
    });

    if (matchedRef) {
      cit.matchedReference = matchedRef.raw;
    } else {
      // Check if surname is found with a different year (author-year mismatch)
      const yearMismatchRef = references.find((ref) => {
        return ref.raw.toLowerCase().includes(citSurname);
      });

      if (yearMismatchRef) {
        authorYearMismatches.push(
          `Citation "${cit.raw}" mentions year ${citYear}, but matching reference "${yearMismatchRef.raw.slice(0, 50)}..." has year ${yearMismatchRef.year || "different"}.`
        );
      } else {
        missingReferences.push(cit.raw);
      }
    }
  });

  // Match References -> Citations
  references.forEach((ref) => {
    const refText = ref.raw.toLowerCase();
    const primaryAuthor = ref.authors[0] ? extractPrimarySurname(ref.authors[0]) : "";
    const refYear = ref.year;

    if (!primaryAuthor) return;

    const isCited = citations.some((cit) => {
      const citSurname = extractPrimarySurname(cit.author);
      const yearMatches = !refYear || cit.year === refYear || (cit.year === "n.d." && refYear === "n.d.");
      return citSurname === primaryAuthor && yearMatches;
    });

    if (!isCited) {
      uncitedReferences.push(ref.raw);
    }
  });

  return {
    missingReferences: Array.from(new Set(missingReferences)),
    uncitedReferences: Array.from(new Set(uncitedReferences)),
    authorYearMismatches: Array.from(new Set(authorYearMismatches)),
  };
}

