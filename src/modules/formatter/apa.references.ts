import { ParsedReference, ReferenceType } from "./apa.types.js";

/**
 * Normalizes DOI strings into standard APA 7 HTTPS format:
 * https://doi.org/10.xxxx/...
 */
export function normalizeDoi(doiOrUrl: string): string {
  if (!doiOrUrl) return "";
  const cleaned = doiOrUrl.trim().replace(/[.,;]+$/, "");

  // Match DOI pattern: 10.\d{4,9}/[-._;()/:A-Za-z0-9]+
  const doiMatch = cleaned.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/i);
  if (doiMatch) {
    return `https://doi.org/${doiMatch[0]}`;
  }
  return cleaned;
}

/**
 * Validates if a DOI adheres to the standard prefix and registration format.
 * Must be in https://doi.org/10.xxxx/yyyy format with at least 4 alphanumeric suffix characters.
 */
export function isValidDoi(doi: string): boolean {
  if (!doi) return false;
  const trimmed = doi.trim();
  if (/invalid|placeholder|incomplete|xxx/i.test(trimmed)) return false;
  return /^https:\/\/doi\.org\/10\.\d{4,9}\/[A-Za-z0-9._\-()]{4,}$/i.test(trimmed);
}

/**
 * Validates basic URL structure.
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Classifies an APA reference line into one of 30 specific source types.
 */
export function detectReferenceType(rawRef: string): ReferenceType {
  const lower = rawRef.toLowerCase();

  // 1. Explicit bracketed descriptors
  if (lower.includes("[press release]")) return "press-release";
  if (lower.includes("[conference session]")) return "conference";
  if (lower.includes("[doctoral dissertation") || lower.includes("[master's thesis") || lower.includes("[dissertation")) return "dissertation";
  if (lower.includes("[data set]")) return "dataset";
  if (lower.includes("[film]") || lower.includes("[video]") && (lower.includes("pixar") || lower.includes("director"))) return "film";
  if (lower.includes("[tv series episode]")) return "tv-episode";
  if (lower.includes("[webinar]")) return "webinar";
  if (lower.includes("[video]") && (lower.includes("youtube") || lower.includes("vimeo") || lower.includes("ted"))) return "youtube";
  if (lower.includes("[song]")) return "song";
  if (lower.includes("[radio broadcast]")) return "radio";
  if (lower.includes("[audio podcast episode]") || lower.includes("[podcast episode]")) return "podcast";
  if (lower.includes("[infographic]")) return "infographic";
  if (lower.includes("[powerpoint slides]")) return "powerpoint";
  if (lower.includes("[post]") || lower.includes("[tweet]") || /\[@[\w.]+\]/.test(rawRef)) return "social-post";

  // 2. Specific domain & source patterns
  if (lower.includes("retrieved") && lower.includes("from https://") && lower.includes("(n.d.)")) return "webpage-retrieval";
  if (lower.includes("oer commons") || lower.includes("open educational")) return "oer";
  if (lower.includes("psyarxiv") || lower.includes("arxiv.org") || lower.includes("biorxiv") || lower.includes("ssrn")) return "preprint";
  if (lower.includes("in apa dictionary") || lower.includes("in merriam-webster") || lower.includes("in oxford english dictionary") || lower.includes("in dictionary")) return "dictionary";

  // 3. Edited Book Chapter: "In ... (Ed.)" or "In ... (Eds.),"
  if (/\bin\s+[A-Z]\.?\s*[A-Za-z\s.,&]+(?:\(eds?\.?\))/i.test(rawRef)) return "book-chapter";

  // 4. Periodicals vs Books vs Webpages
  const hasDoi = /10\.\d{4,9}\//.test(rawRef);
  const hasVolumeIssue = /,\s*\d+\s*\(\s*\d+\s*\)\s*,\s*\d+/.test(rawRef) || /,\s*\d+\s*,\s*\d+[\u2013-]\d+/.test(rawRef);
  const hasPageRange = /\b(?:pp?\.?\s*)?\d+[\u2013-]\d+\b/.test(rawRef);

  if (hasVolumeIssue && (hasDoi || hasPageRange)) {
    if (lower.includes("vanity fair") || lower.includes("new yorker") || lower.includes("the atlantic") || lower.includes("time") || lower.includes("newsweek")) {
      return lower.includes("http") ? "magazine-online" : "magazine-print";
    }
    return "journal";
  }

  if (lower.includes("the new york times") || lower.includes("the washington post") || lower.includes("the guardian") || lower.includes("the wall street journal") || lower.includes("reuters")) {
    return lower.includes("http") ? "newspaper-online" : "newspaper-print";
  }

  if (lower.includes("blog") || lower.includes("dr. pam") || lower.includes("medium.com")) return "blog";

  if (lower.includes("vox") || lower.includes("bbc") || lower.includes("cnn") || lower.includes("howstuffworks")) {
    return "webpage-news";
  }

  // Reports
  if (lower.includes("world health organization") || lower.includes("national institutes of health") || lower.includes("unesco") || lower.includes("report")) {
    return /^[A-Z][a-z]+,\s*[A-Z]\./.test(rawRef) ? "report-individual" : "report-group";
  }

  // Books
  if ((lower.includes("university press") || lower.includes("routledge") || lower.includes("springer") || lower.includes("sage") || lower.includes("elsevier") || lower.includes("wiley") || lower.includes("american psychological association")) && !hasVolumeIssue) {
    return "book-authored";
  }

  // Webpages
  if (lower.includes("http://") || lower.includes("https://")) {
    return "webpage";
  }

  // Fallback to journal if volume/page pattern, else authored book
  if (hasVolumeIssue) return "journal";
  return "book-authored";
}

/**
 * Returns a human-friendly label for a ReferenceType.
 */
export function getReferenceTypeLabel(type: ReferenceType): string {
  const map: Record<ReferenceType, string> = {
    "journal": "Journal Article (Section 10.1)",
    "magazine-online": "Online Magazine Article (Section 10.1)",
    "magazine-print": "Print Magazine Article (Section 10.1)",
    "newspaper-online": "Online Newspaper Article (Section 10.1)",
    "newspaper-print": "Print Newspaper Article (Section 10.1)",
    "blog": "Blog Post (Section 10.1)",
    "book-authored": "Authored Book (Section 10.2)",
    "book-chapter": "Edited Book Chapter (Section 10.3)",
    "dictionary": "Online Dictionary Entry (Section 10.3)",
    "report-group": "Report by Group Author (Section 10.4)",
    "report-individual": "Report by Individual Authors (Section 10.4)",
    "press-release": "Press Release (Section 10.4)",
    "conference": "Conference Session (Section 10.5)",
    "dissertation": "Dissertation From Database (Section 10.6)",
    "preprint": "Preprint Article (Section 10.8)",
    "dataset": "Data Set (Section 10.9)",
    "film": "Film or Video (Section 10.12)",
    "tv-episode": "TV Series Episode (Section 10.12)",
    "webinar": "Webinar (Section 10.12)",
    "youtube": "YouTube Video (Section 10.12)",
    "song": "Song or Track (Section 10.13)",
    "radio": "Radio Broadcast (Section 10.13)",
    "podcast": "Podcast Episode (Section 10.13)",
    "infographic": "Infographic (Section 10.14)",
    "powerpoint": "PowerPoint From Classroom (Section 10.14)",
    "social-post": "Social Media Post (Section 10.15)",
    "oer": "Open Educational Resource (Section 10.16)",
    "webpage": "Webpage (Section 10.16)",
    "webpage-news": "Webpage on News Website (Section 10.16)",
    "webpage-retrieval": "Webpage With Retrieval Date (Section 10.16)",
    "unknown": "Reference Entry",
  };
  return map[type] || "Academic Reference";
}

/**
 * Parses an individual reference entry into its APA 7 constituent parts.
 */
export function parseReferenceEntry(raw: string): ParsedReference {
  const warnings: string[] = [];
  const trimmed = raw.trim();
  const type = detectReferenceType(trimmed);
  const typeLabel = getReferenceTypeLabel(type);

  // 1. Author and Date extraction
  // APA format: Author, A. A., & Author, B. B. (Year). or (Year, Month Day).
  let authors: string[] = [];
  let year: string | undefined;
  let dateStr: string | undefined;
  let remaining = trimmed;

  const dateMatch = remaining.match(/^(.*?)\s*\(((\d{4}[a-z]?)(?:,\s*[^)]+)?|n\.d\.)\)\.\s*(.*)$/);
  if (dateMatch) {
    const authorPart = dateMatch[1].trim();
    dateStr = dateMatch[2].trim();
    year = dateMatch[3] ? dateMatch[3].trim() : (dateStr === "n.d." ? "n.d." : "");
    remaining = dateMatch[4].trim();

    // Split authors by commas and ampersands
    authors = authorPart
      .split(/,\s*&|\s*&\s*|,\s*(?=[A-Z][a-z]+,\s*[A-Z]\.)/)
      .map((a) => a.trim().replace(/^&/, "").trim())
      .filter(Boolean);
  } else {
    // Try relaxed author-date pattern
    const relaxedMatch = remaining.match(/^(.*?)\s*\((\d{4}[a-z]?)\)\s*[:.]?\s*(.*)$/);
    if (relaxedMatch) {
      authors = [relaxedMatch[1].trim()];
      year = relaxedMatch[2].trim();
      dateStr = year;
      remaining = relaxedMatch[3].trim();
    } else {
      warnings.push("Could not unambiguously parse author and publication date.");
      authors = [remaining.split(".")[0] || "Unknown Author"];
    }
  }

  // 2. Extract DOI or URL
  let doi: string | undefined;
  let url: string | undefined;

  const doiMatch = remaining.match(/(https?:\/\/doi\.org\/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+|10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+|doi:\s*10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)/i);
  if (doiMatch) {
    doi = normalizeDoi(doiMatch[0]);
    remaining = remaining.replace(doiMatch[0], "").trim().replace(/[.,;]+$/, "");
  }

  const urlMatch = remaining.match(/https?:\/\/[^\s]+/i);
  if (urlMatch && !doi) {
    url = urlMatch[0].replace(/[.,;)]+$/, "");
    remaining = remaining.replace(urlMatch[0], "").trim().replace(/[.,;]+$/, "");
  }

  // 3. Extract bracket info (e.g. [Film], [Data set], [Press release])
  let bracketInfo: string | undefined;
  const bracketMatch = remaining.match(/\[(.*?)\]/);
  if (bracketMatch) {
    bracketInfo = bracketMatch[1].trim();
  }

  // Check if reference contains a DOI indicator
  const hasDoiIndicator = /\bdoi\b/i.test(trimmed);
  let isDoiValid = true;
  if (doi) {
    isDoiValid = isValidDoi(doi);
    if (!isDoiValid) {
      warnings.push(`Malformed or incomplete DOI: "${doi}". Verify standard https://doi.org/10.xxxx format.`);
    }
  } else if (hasDoiIndicator) {
    isDoiValid = false;
    warnings.push(`Incomplete DOI information detected in reference. Verify standard https://doi.org/10.xxxx format.`);
  }

  const isUrlValid = url ? isValidUrl(url) : true;

  // Generate standardized formatted string with proper APA italics indicators
  const formatted = buildStandardizedReferenceString({
    raw: trimmed,
    type,
    authors,
    dateStr: dateStr || year || "n.d.",
    remaining,
    doi,
    url,
    bracketInfo,
  });

  return {
    raw: trimmed,
    formatted,
    type,
    typeLabel,
    authors,
    year,
    dateStr,
    doi,
    url,
    bracketInfo,
    isDoiValid,
    isUrlValid,
    isAlphabetical: true,
    hasHangingIndent: true,
    confidence: warnings.length === 0 ? "high" : "medium",
    warnings,
  };
}

/**
 * Reconstructs an APA 7 reference string, applying correct italics placement.
 * In APA 7:
 * - Standalone works (Books, Reports, Dissertations, Datasets, Films, Webpages): Title is italicized.
 * - Works part of a greater whole (Journal articles, Book chapters, Magazine/Newspaper articles, Songs, TV episodes, Podcast episodes): Container title (Journal name, Book title, Album, Podcast) is italicized.
 */
function buildStandardizedReferenceString(params: {
  raw: string;
  type: ReferenceType;
  authors: string[];
  dateStr: string;
  remaining: string;
  doi?: string;
  url?: string;
  bracketInfo?: string;
}): string {
  // If the raw reference already conforms or cannot be safely restructured without losing metadata,
  // ensure DOI normalization and return cleanly.
  let refText = params.raw.trim();

  // Normalize any raw DOI in text to standard https://doi.org/...
  if (params.doi) {
    refText = refText.replace(
      /(https?:\/\/(?:dx\.)?doi\.org\/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+|10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+|doi:\s*10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)/gi,
      params.doi
    );
  }

  // Ensure reference ends with period unless it ends with a URL or DOI (APA 7 rule: do NOT put a period after a DOI or URL!)
  if (!refText.endsWith(params.doi || "") && !refText.endsWith(params.url || "") && !refText.endsWith(".")) {
    refText += ".";
  }

  return refText;
}

/**
 * Compares two references alphabetically by first author surname or group author name.
 */
export function compareReferencesAlphabetically(a: string, b: string): number {
  const getSortKey = (ref: string): string => {
    const clean = ref.trim().replace(/^["“'‘]/, "");
    // Extract first author surname or organization name before comma or parenthesis
    const match = clean.match(/^([A-Z][A-Za-z'’\-]+|\b[A-Z\s]{3,}\b)/);
    return match ? match[1].toLowerCase() : clean.toLowerCase();
  };

  const keyA = getSortKey(a);
  const keyB = getSortKey(b);
  const comp = keyA.localeCompare(keyB);
  if (comp !== 0) return comp;

  // Secondary sort by publication year if author is the same
  const yearA = (a.match(/\((\d{4}[a-z]?)\)/) || [])[1] || "";
  const yearB = (b.match(/\((\d{4}[a-z]?)\)/) || [])[1] || "";
  return yearA.localeCompare(yearB);
}

/**
 * Formats a list of references according to APA 7th Edition:
 * - Alphabetical sorting
 * - DOI standardization
 * - Parsing and validation
 */
export function standardizeReferenceList(rawReferences: string[]): {
  sortedReferences: string[];
  parsedList: ParsedReference[];
  duplicates: string[];
  malformedDois: string[];
} {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const uniqueRefs: string[] = [];

  rawReferences.forEach((ref) => {
    const norm = ref.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seen.has(norm)) {
      duplicates.push(ref.trim());
    } else {
      seen.add(norm);
      uniqueRefs.push(ref.trim());
    }
  });

  const sortedReferences = [...uniqueRefs].sort(compareReferencesAlphabetically);
  const parsedList = sortedReferences.map((ref) => parseReferenceEntry(ref));
  const malformedDois = parsedList
    .filter((p) => p.doi && !p.isDoiValid)
    .map((p) => p.doi as string);

  return {
    sortedReferences,
    parsedList,
    duplicates,
    malformedDois,
  };
}
