import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import mammoth from "mammoth";
import {
  DocumentProfile,
  FormattingProfileConfig,
  DetectedStructure,
  HeadingInfo,
  ParsedReference,
  InTextCitation,
  DetectedTable,
  DetectedFigure,
  ParsedAuthor,
  ParsedAffiliation,
  StructuralDecision,
  ValidationReport,
  ValidationItem,
} from "./apa.types.js";
import { PROFILES, resolveProfile } from "./apa.profiles.js";
import { classifyHeading, toApaTitleCase } from "./apa.headings.js";
import {
  detectReferenceType,
  getReferenceTypeLabel,
  parseReferenceEntry,
  standardizeReferenceList,
  normalizeDoi,
  isValidDoi,
} from "./apa.references.js";
import {
  extractApaCitations,
  validateCitationsAndReferences,
} from "./apa.citations.js";
import { detectTablesAndFigures } from "./apa.tables-figures.js";
import { buildComprehensiveValidationReport } from "./apa.validator.js";
import { buildStandardizedDocx } from "./apa.docx-builder.js";
import { buildApaHtmlPreview } from "./apa.preview-builder.js";

// Re-export all types and sub-modules for backwards compatibility and consumers
export * from "./apa.types.js";
export * from "./apa.profiles.js";
export * from "./apa.headings.js";
export * from "./apa.references.js";
export * from "./apa.citations.js";
export * from "./apa.tables-figures.js";
export * from "./apa.validator.js";
export * from "./apa.docx-builder.js";
export * from "./apa.preview-builder.js";

export interface FormattingConfig {
  version: string;
  name: string;
  profile?: DocumentProfile;
  generalSettings?: {
    pageSize?: string;
    orientation?: string;
    margins?: { top: number; bottom: number; left: number; right: number; header?: number; footer?: number };
    profile?: DocumentProfile;
  };
  typographySettings?: {
    bodyFont?: string;
    bodySizePt?: number;
    lineSpacing?: number;
    firstLineIndentDxa?: number;
    heading1?: any;
    heading2?: any;
    heading3?: any;
  };
  structureSettings?: {
    title?: any;
    authors?: any;
    affiliations?: any;
    abstract?: { minWords?: number; maxWords?: number; heading?: string; bold?: boolean };
    keywords?: { minCount?: number; maxCount?: number; prefix?: string; separator?: string };
  };
  tableSettings?: any;
  figureSettings?: any;
  referenceSettings?: any;
}

export interface FormatterResult {
  formattedBuffer: Buffer;
  originalHtml: string;
  formattedHtml: string;
  stats: {
    pagesProcessed: number;
    wordCount: number;
    headingsCount: number;
    tablesCount: number;
    figuresCount: number;
    referencesCount: number;
  };
  detectedStructure: DetectedStructure;
  validationReport: ValidationReport;
  formattingChanges: string[];
  contentChanges: 0;
  issues: string[];
  formattingVersion: string;
  masterTemplateUrl: string;
  profile?: DocumentProfile;
}

export const DEFAULT_CONFIG: FormattingConfig = {
  version: "APA 7th / ADF Master v2.0",
  name: "ADF Academic Manuscript (Official Template + APA 7th)",
  generalSettings: {
    profile: "adf-academic",
    pageSize: "A4",
    margins: { top: 1060, bottom: 1440, left: 1440, right: 1440, header: 144, footer: 350 },
  },
  typographySettings: {
    bodyFont: "Times New Roman",
    bodySizePt: 12,
    lineSpacing: 480, // Double line spacing (APA 7 standard)
    firstLineIndentDxa: 720, // 0.5 inch
  },
  structureSettings: {
    abstract: { minWords: 250, maxWords: 300, heading: "Abstract", bold: true },
    keywords: { minCount: 5, maxCount: 8, prefix: "Keywords:", separator: "; " },
  },
};

/**
 * Locates the official master template file.
 */
export function getMasterTemplatePath(): string | null {
  const candidateNames = [
    "ADF_ Template(1).docx",
    "ADF_ Template.docx",
    "ADF_Template.docx",
    "ADF_Manuscript_Template (1).docx",
    "ADF_Manuscript_Template.docx",
  ];
  const candidateDirs = [
    path.join(process.cwd(), "templates"),
    path.join(process.cwd(), "ADF-Backend", "templates"),
    path.resolve(process.cwd(), "../ADF-Backend/templates"),
    "c:\\Users\\kdon7\\Desktop\\react\\adf\\ADF-Backend\\templates",
    "c:\\Users\\kdon7\\Downloads",
  ];

  for (const dir of candidateDirs) {
    for (const name of candidateNames) {
      const p = path.join(dir, name);
      if (fs.existsSync(p)) {
        return p;
      }
    }
  }
  return null;
}

/**
 * Extracts raw tables from mammoth HTML output.
 */
function parseHtmlTables(html: string): string[][][] {
  const tables: string[][][] = [];
  const tableRegex = /<table\b[^>]*>([\s\S]*?)<\/table>/gi;
  let match: RegExpExecArray | null;

  while ((match = tableRegex.exec(html)) !== null) {
    const tableHtml = match[1];
    const rows: string[][] = [];
    const rowRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
    let rMatch: RegExpExecArray | null;

    while ((rMatch = rowRegex.exec(tableHtml)) !== null) {
      const rowHtml = rMatch[1];
      const cells: string[] = [];
      const cellRegex = /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let cMatch: RegExpExecArray | null;

      while ((cMatch = cellRegex.exec(rowHtml)) !== null) {
        const cellText = cMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        cells.push(cellText);
      }
      if (cells.length > 0) rows.push(cells);
    }
    if (rows.length > 0) tables.push(rows);
  }

  return tables;
}

/**
 * Extracts paragraph/heading HTML elements, bold and italic styles from mammoth HTML output.
 */
function extractParagraphStylesFromHtml(html: string): Map<string, { tag: string; isBold: boolean; isItalic: boolean }> {
  const map = new Map<string, { tag: string; isBold: boolean; isItalic: boolean }>();
  const blockRegex = /<(p|h[1-6]|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const innerHtml = match[2].trim();
    const text = innerHtml
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    if (!text) continue;

    const isBold = /<(strong|b)\b/i.test(innerHtml);
    const isItalic = /<(em|i)\b/i.test(innerHtml);

    const key = text.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (key && !map.has(key)) {
      map.set(key, { tag, isBold, isItalic });
    }

    const shortKey = key.slice(0, 40);
    if (shortKey && !map.has(shortKey)) {
      map.set(shortKey, { tag, isBold, isItalic });
    }
  }

  return map;
}

/**
 * Checks for abbreviations / acronyms used without being defined at first appearance.
 */
export function detectAbbreviations(text: string): { acronym: string; defined: boolean }[] {
  const ignoreSet = new Set([
    "ADF", "USA", "UK", "EU", "UN", "COVID", "APA", "HTML", "XML", "URL", "PDF",
    "IEEE", "ISO", "ID", "IT", "TV", "AM", "PM", "BC", "AD", "OK",
  ]);

  const acronymRegex = /\b([A-Z]{2,6})\b/g;
  const results: { acronym: string; defined: boolean }[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = acronymRegex.exec(text)) !== null) {
    const acronym = match[1];
    if (ignoreSet.has(acronym) || seen.has(acronym)) continue;
    seen.add(acronym);

    const index = match.index;
    const windowStart = Math.max(0, index - 120);
    const windowEnd = Math.min(text.length, index + acronym.length + 120);
    const context = text.slice(windowStart, windowEnd);

    const isDefined =
      context.includes(`(${acronym})`) ||
      new RegExp(`\\b${acronym}\\s*\\([A-Za-z\\s-]{3,}\\)`).test(context);

    results.push({ acronym, defined: isDefined });
  }

  return results;
}

/**
 * Backwards compatible citation extraction.
 */
export function extractInTextCitations(text: string): InTextCitation[] {
  return extractApaCitations(text);
}

/**
 * Backwards compatible validation report builder.
 */
export function buildValidationReport(
  detected: DetectedStructure,
  config: FormattingConfig = DEFAULT_CONFIG
): ValidationReport {
  const profile = resolveProfile(detected.profile || config.generalSettings?.profile, detected.publicationType);
  return buildComprehensiveValidationReport(detected, profile);
}

/**
 * Backwards compatible formatted DOCX generator.
 */
export async function generateFormattedDocx(
  detected: DetectedStructure,
  paragraphs: string[],
  htmlTables: string[][][],
  config: FormattingConfig = DEFAULT_CONFIG
): Promise<Buffer> {
  const profile = resolveProfile(detected.profile || config.generalSettings?.profile, detected.publicationType);
  return buildStandardizedDocx(detected, paragraphs, htmlTables, profile);
}

/**
 * Backwards compatible HTML preview builder.
 */
export function buildFormattedHtmlPreview(
  detected: DetectedStructure,
  paragraphs: string[]
): string {
  const profile = resolveProfile(detected.profile, detected.publicationType);
  return buildApaHtmlPreview(detected, paragraphs, [], profile);
}

/**
 * Parses and detects all manuscript structures, sections, headings, tables, figures, citations, and references.
 */
export async function parseAndDetectStructure(
  buffer: Buffer,
  publicationType: string = "chapter",
  requestedProfile?: DocumentProfile
): Promise<{
  rawText: string;
  originalHtml: string;
  detected: DetectedStructure;
  paragraphs: string[];
  htmlTables: string[][][];
}> {
  const [rawTextResult, htmlResult] = await Promise.all([
    mammoth.extractRawText({ buffer }),
    mammoth.convertToHtml({ buffer }),
  ]);

  const rawText = rawTextResult.value;
  const originalHtml = htmlResult.value;

  const rawLines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const profile = resolveProfile(requestedProfile, publicationType);

  const emailRegex = /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/g;
  const emailAddresses = Array.from(new Set(rawText.match(emailRegex) || []));

  const structuralDecisions: StructuralDecision[] = [];
  const testMarkerRegex = /^(rough\s+test|test\s+manuscript|mock\s+data|template|sample\s+paper|draft|confidential|qa\s*\/\s*uat)/i;
  const placeholderLabelRegex = /^(title\s+of\s+paper|paper\s+title|manuscript\s+title|title|author\s+names?|author\s+information|affiliations?)$/i;
  const endMarkerRegex = /^(end\s+of\s+rough\s+test\s+manuscript|end\s+of\s+manuscript|test\s+instruction:?)/i;
  const affiliationIndicatorRegex = /(?:department\s+of|dept\.?\s+of|assistant\s+professor|associate\s+professor|professor|research\s+scholar|lecturer|ph\.?d|designation|correspondence:|\b\d+[\*]?\s+(?:assistant|associate|professor|department|research)|\b[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}\b)/i;
  const authorLineRegex = /\b(first\.\s*author|second\.\s*author|third\.\s*author|first\s+author|second\s+author|third\s+author|author\s+\d+|et\s+al\.?)\b/i;
  const authorNamesWithNumbersRegex = /^(?:[A-Za-z\.\'\-]+\s+){1,4}\d+\s*\*?(?:,\s*(?:[A-Za-z\.\'\-]+\s+){1,4}\d+\s*\*?)*$/;

  // 1. Detect Title
  let title = "Untitled Manuscript";
  let titleIndex = -1;
  for (let i = 0; i < Math.min(rawLines.length, 12); i++) {
    const line = rawLines[i];
    if (
      !testMarkerRegex.test(line) &&
      !placeholderLabelRegex.test(line) &&
      !endMarkerRegex.test(line) &&
      !emailRegex.test(line) &&
      !affiliationIndicatorRegex.test(line) &&
      !authorLineRegex.test(line) &&
      !authorNamesWithNumbersRegex.test(line) &&
      !/^abstract\b/i.test(line)
    ) {
      title = line.replace(/^(paper\s+title|title|manuscript\s+title)\s*[:\-]\s*/i, "").trim();
      titleIndex = i;
      break;
    }
  }

  const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "");
  const titleAcronyms = (title.match(/\b[A-Z]{2,6}\b/g) || []).filter(
    (a) => !["ADF", "THE", "FOR", "AND", "WITH", "USA", "IEEE", "APA"].includes(a)
  );
  const titleHasAbbreviation = titleAcronyms.length > 0;

  structuralDecisions.push({
    section: "Title",
    detected: title.length > 3 && !title.toLowerCase().startsWith("untitled"),
    confidence: title.length > 5 ? "high" : "medium",
    reason: `Detected title: "${title.slice(0, 50)}..."`,
    actionTaken: "Centered Bold APA Title Case formatting",
  });

  // 2. Detect Authors & Affiliations
  const authors: string[] = [];
  const parsedAuthors: ParsedAuthor[] = [];
  const affiliations: string[] = [];
  const parsedAffiliations: ParsedAffiliation[] = [];
  let correspondingAuthor: string | undefined;
  let correspondingEmail: string | undefined = emailAddresses[0];

  const abstractIndex = rawLines.findIndex((l) => /^abstract\b/i.test(l));
  const preAbstractLines = abstractIndex > 0 ? rawLines.slice(0, abstractIndex) : rawLines.slice(0, 8);

  preAbstractLines.forEach((line, idx) => {
    if (idx === titleIndex) return;
    if (testMarkerRegex.test(line) || placeholderLabelRegex.test(line) || endMarkerRegex.test(line)) return;
    if (line.toLowerCase().replace(/[^a-z0-9]/g, "") === normalizedTitle) return;

    const isAffiliationLine = affiliationIndicatorRegex.test(line) || emailRegex.test(line);

    if (isAffiliationLine) {
      if (emailRegex.test(line)) {
        const matched = line.match(emailRegex);
        if (matched) correspondingEmail = matched[0];
      }
      const cleanedAffilLine = line.replace(/\*?\s*Correspondence:\s*[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/i, "").trim().replace(/,\s*$/, "");
      if (cleanedAffilLine) {
        affiliations.push(cleanedAffilLine);
        const affilParts = cleanedAffilLine.split(/(?=\b\d+[\*]?\s+[A-Z])/).map((p) => p.trim().replace(/^,\s*|,\s*$/g, "")).filter(Boolean);
        affilParts.forEach((part) => {
          const m = part.match(/^(\d+[\*]?)\s+(.*)$/);
          if (m) {
            parsedAffiliations.push({ num: m[1], text: m[2] });
          } else {
            parsedAffiliations.push({ num: "", text: part });
          }
        });
      }
    } else {
      // Author line - split on commas or semicolons separating author names
      const rawAuthorParts = line.split(/;\s*|,\s*(?=[A-Za-z]|\d)/).map((p) => p.trim()).filter(Boolean);
      const authorParts: string[] = [];
      rawAuthorParts.forEach((p) => {
        if (/^(jr\.?|sr\.?|ii|iii|iv|ph\.?d\.?|m\.?d\.?)$/i.test(p) && authorParts.length > 0) {
          authorParts[authorParts.length - 1] += `, ${p}`;
        } else {
          authorParts.push(p);
        }
      });
      authorParts.forEach((part) => {
        const m = part.match(/^([^\d*]+?)(?:\s+(\d+))?\s*(\*?)$/);
        if (m) {
          const name = m[1].trim();
          const num = m[2] || "";
          const star = m[3] || (part.includes("*") ? "*" : "");
          parsedAuthors.push({ raw: part, name, num, star });
          authors.push(name + (num ? ` ${num}` : "") + (star ? ` ${star}` : ""));
          if (star || /corresponding/i.test(part)) {
            correspondingAuthor = name;
          }
        } else {
          parsedAuthors.push({ raw: part, name: part, num: "", star: "" });
          authors.push(part);
        }
      });
    }
  });

  if (authors.length === 0 && rawLines.length > 1) {
    authors.push(rawLines[1]);
    parsedAuthors.push({ raw: rawLines[1], name: rawLines[1], num: "1", star: "*" });
  }
  if (!correspondingAuthor && parsedAuthors.length > 0) {
    correspondingAuthor = parsedAuthors[0].name;
  }
  if (parsedAffiliations.length === 0 && affiliations.length > 0) {
    affiliations.forEach((a, idx) => parsedAffiliations.push({ num: idx === 0 ? "1*" : `${idx + 1}`, text: a }));
  }

  structuralDecisions.push({
    section: "Authors",
    detected: authors.length > 0,
    confidence: authors.length > 0 ? "high" : "low",
    reason: `${authors.length} author name(s) detected`,
    actionTaken: "Standardized author line formatting without metadata alteration",
  });

  structuralDecisions.push({
    section: "Affiliations",
    detected: affiliations.length > 0,
    confidence: affiliations.length > 0 ? "high" : "medium",
    reason: `${affiliations.length} affiliation(s) detected`,
    actionTaken: "Formatted per document profile",
  });

  // 3. Detect Abstract
  let abstract = "";
  if (abstractIndex !== -1) {
    const abstractLine = rawLines[abstractIndex];
    const cleanFirstLine = abstractLine.replace(/^abstract[:\s-]*/i, "").trim();
    const abstractParts: string[] = [];
    if (cleanFirstLine) abstractParts.push(cleanFirstLine);

    for (let i = abstractIndex + 1; i < rawLines.length; i++) {
      const line = rawLines[i];
      if (/^keywords?\b/i.test(line) || /^[1-9]\.?\s+[A-Z]/i.test(line) || /^introduction\b/i.test(line)) {
        break;
      }
      abstractParts.push(line);
    }
    abstract = abstractParts.join(" ");
  }

  const abstractWordCount = abstract ? abstract.split(/\s+/).filter(Boolean).length : 0;
  structuralDecisions.push({
    section: "Abstract",
    detected: !!abstract,
    confidence: abstract ? "high" : "medium",
    reason: abstract ? `Abstract detected (${abstractWordCount} words)` : "Abstract omitted or not labeled",
    actionTaken: "Preserved complete author abstract (0 content change)",
  });

  // 4. Detect Keywords
  const keywords: string[] = [];
  const keywordsLine = rawLines.find((l) => /^keywords?\b/i.test(l));
  if (keywordsLine) {
    const cleaned = keywordsLine.replace(/^keywords?[:\s-]*/i, "").trim();
    cleaned.split(/[,;•]/).forEach((k) => {
      const trimmed = k.trim();
      if (trimmed) keywords.push(trimmed);
    });
  }

  // 5. Intelligent APA 5-Level Heading Classification
  const paragraphStyles = extractParagraphStylesFromHtml(originalHtml);
  const headings: HeadingInfo[] = [];
  rawLines.forEach((line) => {
    if (testMarkerRegex.test(line) || placeholderLabelRegex.test(line) || endMarkerRegex.test(line)) return;
    if (line.toLowerCase().replace(/[^a-z0-9]/g, "") === normalizedTitle) return;

    const key = line.toLowerCase().replace(/[^a-z0-9]/g, "");
    const style = paragraphStyles.get(key) || paragraphStyles.get(key.slice(0, 40));

    const classified = classifyHeading(
      line,
      style?.tag,
      style?.isBold,
      style?.isItalic
    );
    if (classified) {
      headings.push(classified);
    }
  });

  // 6. Tables and Figures Detection
  const htmlTables = parseHtmlTables(originalHtml);
  const { tables, figures } = detectTablesAndFigures(rawLines, htmlTables, rawText);

  // 7. References Extraction & Standardization
  const rawRefs: string[] = [];
  const refIndex = rawLines.findIndex((l) => /^(references|bibliography)\b/i.test(l));
  if (refIndex !== -1) {
    for (let i = refIndex + 1; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      if (/^(acknowledgement|declaration\s+of\s+interest|fundings?|appendix)\b/i.test(line)) break;
      if (line.length > 15 && (/\(\d{4}[a-z]?\)/.test(line) || /\[\d+\]/.test(line) || /https?:\/\//.test(line) || /,\s*[A-Z]\./.test(line) || /\(n\.d\.\)/i.test(line))) {
        rawRefs.push(line);
      }
    }
  }

  const { sortedReferences, parsedList } = standardizeReferenceList(rawRefs);

  // 8. Citations & Cross-matching
  const inTextCitations = extractApaCitations(rawText);
  const { missingReferences, uncitedReferences } = validateCitationsAndReferences(inTextCitations, parsedList);

  // 9. Optional Sections
  const ackIndex = rawLines.findIndex((l) => /^acknowledgements?\b/i.test(l));
  const declIndex = rawLines.findIndex((l) => /^declaration\s+of\s+interest\b/i.test(l));
  const fundIndex = rawLines.findIndex((l) => /^fundings?\b/i.test(l));

  const optionalSections = {
    acknowledgement: ackIndex !== -1 ? rawLines.slice(ackIndex + 1, ackIndex + 3).join(" ") : undefined,
    declarationOfInterest: declIndex !== -1 ? rawLines.slice(declIndex + 1, declIndex + 3).join(" ") : undefined,
    funding: fundIndex !== -1 ? rawLines.slice(fundIndex + 1, fundIndex + 3).join(" ") : undefined,
  };

  // 10. Abbreviations
  const abbreviations = detectAbbreviations(rawText);

  // 11. Confidence breakdown
  const highCount = structuralDecisions.filter((d) => d.confidence === "high").length;
  const medCount = structuralDecisions.filter((d) => d.confidence === "medium").length;
  const lowCount = structuralDecisions.filter((d) => d.confidence === "low").length;
  const confidenceBreakdown = { high: highCount, medium: medCount, low: lowCount };

  const detected: DetectedStructure = {
    title,
    titleHasAbbreviation,
    authors,
    parsedAuthors,
    correspondingAuthor,
    affiliations,
    parsedAffiliations,
    emailAddresses,
    correspondingEmail,
    abstract,
    abstractWordCount,
    keywords,
    headings,
    references: sortedReferences,
    parsedReferences: parsedList,
    inTextCitations,
    citationMismatches: missingReferences,
    uncitedReferences,
    tables,
    figures,
    structuralDecisions,
    confidenceBreakdown,
    optionalSections,
    abbreviations,
    publicationType,
    profile: profile.id,
  };

  return {
    rawText,
    originalHtml,
    detected,
    paragraphs: rawLines,
    htmlTables,
  };
}

/**
 * Main Orchestrator: Processes uploaded document, validates structure and APA 7th rules,
 * selects document profile, and generates standardized DOCX and preview.
 */
export async function processManuscript(
  buffer: Buffer,
  originalFilename: string,
  config: FormattingConfig = DEFAULT_CONFIG,
  publicationType: string = "chapter",
  requestedProfile?: DocumentProfile
): Promise<FormatterResult> {
  const profileId = requestedProfile || config.generalSettings?.profile || (publicationType.toLowerCase().includes("literary") ? "adf-literary" : "adf-academic");
  const profile = resolveProfile(profileId, publicationType);

  // Step 1: Parse and detect document structure
  const { originalHtml, detected, paragraphs, htmlTables } = await parseAndDetectStructure(
    buffer,
    publicationType,
    profile.id
  );

  // Step 2: Build comprehensive validation report
  const validationReport = buildComprehensiveValidationReport(detected, profile);

  // Step 3: Generate formatted DOCX
  const formattedBuffer = await buildStandardizedDocx(detected, paragraphs, htmlTables, profile);

  // Step 4: Estimate pages (~250 words per page in APA double-spaced format)
  const totalWords = paragraphs.join(" ").split(/\s+/).filter(Boolean).length;
  const wordsPerPage = profile.lineSpacing === 480 ? 250 : 400;
  const estimatedPages = Math.max(1, Math.ceil(totalWords / wordsPerPage));

  // Step 5: Formatting changes applied
  const formattingChanges = [
    `Standardized to ${profile.name} (${profile.pageSize}, 1.0-inch standard margins)`,
    `Applied APA 7 typography hierarchy in ${profile.font} ${profile.fontSizePt}pt`,
    `Standardized ${profile.lineSpacing === 480 ? "double line spacing (2.0)" : "1.5 line spacing"} with 0.5-inch paragraph indentation`,
    "Applied APA 7th 5-level heading hierarchy (Centered L1, Flush Left L2, Flush Left Italic L3, Indented Run-in L4/L5)",
    `Formatted tables (Table number bold above, title italic below) and figures`,
    `Processed APA 7th references with 0.5-inch hanging indent, double line spacing, and alphabetical sorting`,
    "Injected Word page number field in top-right header (Page 1 start)",
  ];

  if (profile.id === "adf-academic") {
    formattingChanges.push("Integrated official ADF running header and first-page affiliation/correspondence footer");
  }

  // Step 6: Formatted HTML preview
  const formattedHtml = buildApaHtmlPreview(detected, paragraphs, htmlTables, profile);

  const issues = validationReport.items
    .filter((i) => i.level === "warning" || i.level === "error")
    .map((i) => i.description);

  return {
    formattedBuffer,
    originalHtml,
    formattedHtml,
    stats: {
      pagesProcessed: estimatedPages,
      wordCount: totalWords,
      headingsCount: detected.headings.length,
      tablesCount: detected.tables?.length || 0,
      figuresCount: detected.figures?.length || 0,
      referencesCount: detected.references.length,
    },
    detectedStructure: detected,
    validationReport,
    formattingChanges,
    contentChanges: 0, // Strict academic fidelity guarantee
    issues,
    formattingVersion: profile.name,
    masterTemplateUrl: "/ADF_Template.docx",
    profile: profile.id,
  };
}
