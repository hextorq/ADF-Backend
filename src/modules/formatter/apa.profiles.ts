import { DocumentProfile, FormattingProfileConfig, ApaFont } from "./apa.types.js";

export const A4_WIDTH_DXA = 11906; // 210mm
export const A4_HEIGHT_DXA = 16838; // 297mm
export const LETTER_WIDTH_DXA = 12240; // 8.5in
export const LETTER_HEIGHT_DXA = 15840; // 11in
export const ONE_INCH_DXA = 1440; // 1.0in
export const HALF_INCH_DXA = 720; // 0.5in

export const APA_APPROVED_FONTS: Record<ApaFont, { defaultSizePt: number; isSans: boolean }> = {
  "Times New Roman": { defaultSizePt: 12, isSans: false },
  "Arial": { defaultSizePt: 11, isSans: true },
  "Calibri": { defaultSizePt: 11, isSans: true },
  "Aptos": { defaultSizePt: 12, isSans: true },
  "Georgia": { defaultSizePt: 11, isSans: false },
};

export const PROFILES: Record<DocumentProfile, FormattingProfileConfig> = {
  "apa-7-student": {
    id: "apa-7-student",
    name: "APA 7th Edition — Student Paper",
    description: "Standard APA 7th Edition Student Paper format with 1-inch margins, double-spacing, ragged right, student title page, and top-right page numbering.",
    pageSize: "A4",
    pageSizeDxa: { width: A4_WIDTH_DXA, height: A4_HEIGHT_DXA },
    marginsDxa: { top: ONE_INCH_DXA, bottom: ONE_INCH_DXA, left: ONE_INCH_DXA, right: ONE_INCH_DXA, header: 720, footer: 720 },
    font: "Times New Roman",
    fontSizePt: 12,
    lineSpacing: 480, // Double line spacing
    paragraphIndentDxa: HALF_INCH_DXA, // 0.5 inch
    paragraphAlignment: "left", // Ragged right margin
    pageNumbering: {
      enabled: true,
      position: "top-right",
      startPage: 1,
      showOnTitlePage: true,
    },
    runningHead: {
      enabled: false,
      maxChars: 50,
    },
    titlePage: {
      type: "apa-student",
      centered: true,
      boldTitle: true,
      includeCourse: true,
      includeInstructor: true,
      includeDate: true,
      includeAuthorNote: false,
    },
    headings: {
      level1: { alignment: "center", bold: true, italic: false, titleCase: true, runIn: false },
      level2: { alignment: "left", bold: true, italic: false, titleCase: true, runIn: false },
      level3: { alignment: "left", bold: true, italic: true, titleCase: true, runIn: false },
      level4: { alignment: "left", bold: true, italic: false, titleCase: true, runIn: true, indentDxa: HALF_INCH_DXA },
      level5: { alignment: "left", bold: true, italic: true, titleCase: true, runIn: true, indentDxa: HALF_INCH_DXA },
    },
    tables: {
      numberBoldAbove: true,
      titleItalicBelow: true,
      academicBorders: true,
      notesBelow: true,
    },
    figures: {
      numberBoldAbove: true,
      titleItalicBelow: true,
      notesBelow: true,
    },
    references: {
      newSectionPageBreak: true,
      headingText: "References",
      headingAlignment: "center",
      headingBold: true,
      hangingIndentDxa: HALF_INCH_DXA,
      lineSpacing: 480, // Double line spacing
      alphabeticalSort: true,
      normalizeDoi: true,
    },
    adfSpecifics: {
      retainWatermark: false,
      retainHeaderLogo: false,
      retainFirstPageFooterAffiliations: false,
      enforceAdfSections: false,
    },
  },

  "apa-7-professional": {
    id: "apa-7-professional",
    name: "APA 7th Edition — Professional Paper",
    description: "APA 7th Edition Professional Paper format with Running Head, professional title page with author note, 1-inch margins, double-spacing, and top-right page numbering.",
    pageSize: "A4",
    pageSizeDxa: { width: A4_WIDTH_DXA, height: A4_HEIGHT_DXA },
    marginsDxa: { top: ONE_INCH_DXA, bottom: ONE_INCH_DXA, left: ONE_INCH_DXA, right: ONE_INCH_DXA, header: 720, footer: 720 },
    font: "Times New Roman",
    fontSizePt: 12,
    lineSpacing: 480, // Double line spacing
    paragraphIndentDxa: HALF_INCH_DXA,
    paragraphAlignment: "left",
    pageNumbering: {
      enabled: true,
      position: "top-right",
      startPage: 1,
      showOnTitlePage: true,
    },
    runningHead: {
      enabled: true,
      maxChars: 50,
    },
    titlePage: {
      type: "apa-professional",
      centered: true,
      boldTitle: true,
      includeCourse: false,
      includeInstructor: false,
      includeDate: false,
      includeAuthorNote: true,
    },
    headings: {
      level1: { alignment: "center", bold: true, italic: false, titleCase: true, runIn: false },
      level2: { alignment: "left", bold: true, italic: false, titleCase: true, runIn: false },
      level3: { alignment: "left", bold: true, italic: true, titleCase: true, runIn: false },
      level4: { alignment: "left", bold: true, italic: false, titleCase: true, runIn: true, indentDxa: HALF_INCH_DXA },
      level5: { alignment: "left", bold: true, italic: true, titleCase: true, runIn: true, indentDxa: HALF_INCH_DXA },
    },
    tables: {
      numberBoldAbove: true,
      titleItalicBelow: true,
      academicBorders: true,
      notesBelow: true,
    },
    figures: {
      numberBoldAbove: true,
      titleItalicBelow: true,
      notesBelow: true,
    },
    references: {
      newSectionPageBreak: true,
      headingText: "References",
      headingAlignment: "center",
      headingBold: true,
      hangingIndentDxa: HALF_INCH_DXA,
      lineSpacing: 480,
      alphabeticalSort: true,
      normalizeDoi: true,
    },
    adfSpecifics: {
      retainWatermark: false,
      retainHeaderLogo: false,
      retainFirstPageFooterAffiliations: false,
      enforceAdfSections: false,
    },
  },

  "adf-academic": {
    id: "adf-academic",
    name: "ADF Academic Manuscript (Official Template + APA 7th)",
    description: "Official ADF publication format: incorporates ADF publisher running header, watermark, first-page affiliation footer, and mandatory academic sections combined with APA 7 headings, tables, figures, and references.",
    pageSize: "A4",
    pageSizeDxa: { width: A4_WIDTH_DXA, height: A4_HEIGHT_DXA },
    marginsDxa: { top: 1060, bottom: ONE_INCH_DXA, left: ONE_INCH_DXA, right: ONE_INCH_DXA, header: 144, footer: 350 },
    font: "Times New Roman",
    fontSizePt: 12,
    lineSpacing: 480, // Double line spacing (APA 7 default, configurable)
    paragraphIndentDxa: HALF_INCH_DXA,
    paragraphAlignment: "left", // Ragged right (APA standard) with justified option
    pageNumbering: {
      enabled: true,
      position: "top-right",
      startPage: 1,
      showOnTitlePage: false, // Title page uses ADF affiliations footer
    },
    runningHead: {
      enabled: true,
      title: "Academic Development Forum Book Chapter",
      maxChars: 60,
    },
    titlePage: {
      type: "adf-master",
      centered: true,
      boldTitle: true,
      includeCourse: false,
      includeInstructor: false,
      includeDate: false,
      includeAuthorNote: false,
    },
    headings: {
      level1: { alignment: "center", bold: true, italic: false, titleCase: true, runIn: false },
      level2: { alignment: "left", bold: true, italic: false, titleCase: true, runIn: false },
      level3: { alignment: "left", bold: true, italic: true, titleCase: true, runIn: false },
      level4: { alignment: "left", bold: true, italic: false, titleCase: true, runIn: true, indentDxa: HALF_INCH_DXA },
      level5: { alignment: "left", bold: true, italic: true, titleCase: true, runIn: true, indentDxa: HALF_INCH_DXA },
    },
    tables: {
      numberBoldAbove: true,
      titleItalicBelow: true,
      academicBorders: true,
      notesBelow: true,
    },
    figures: {
      numberBoldAbove: true,
      titleItalicBelow: true,
      notesBelow: true,
    },
    references: {
      newSectionPageBreak: true,
      headingText: "References",
      headingAlignment: "center",
      headingBold: true,
      hangingIndentDxa: HALF_INCH_DXA,
      lineSpacing: 480,
      alphabeticalSort: true,
      normalizeDoi: true,
    },
    adfSpecifics: {
      retainWatermark: true,
      retainHeaderLogo: true,
      retainFirstPageFooterAffiliations: true,
      enforceAdfSections: true,
    },
  },

  "adf-literary": {
    id: "adf-literary",
    name: "ADF Literary Publication",
    description: "Tailored for creative writing, short stories, essays, and poetry. Preserves line breaks and stanza structure without enforcing scientific research sections.",
    pageSize: "A4",
    pageSizeDxa: { width: A4_WIDTH_DXA, height: A4_HEIGHT_DXA },
    marginsDxa: { top: ONE_INCH_DXA, bottom: ONE_INCH_DXA, left: ONE_INCH_DXA, right: ONE_INCH_DXA, header: 720, footer: 720 },
    font: "Times New Roman",
    fontSizePt: 12,
    lineSpacing: 360, // 1.5 line spacing for literary manuscripts
    paragraphIndentDxa: HALF_INCH_DXA,
    paragraphAlignment: "left",
    pageNumbering: {
      enabled: true,
      position: "top-right",
      startPage: 1,
      showOnTitlePage: true,
    },
    runningHead: {
      enabled: false,
      maxChars: 50,
    },
    titlePage: {
      type: "literary",
      centered: true,
      boldTitle: true,
      includeCourse: false,
      includeInstructor: false,
      includeDate: false,
      includeAuthorNote: false,
    },
    headings: {
      level1: { alignment: "center", bold: true, italic: false, titleCase: true, runIn: false },
      level2: { alignment: "left", bold: true, italic: false, titleCase: true, runIn: false },
      level3: { alignment: "left", bold: true, italic: true, titleCase: true, runIn: false },
      level4: { alignment: "left", bold: true, italic: false, titleCase: true, runIn: false, indentDxa: 0 },
      level5: { alignment: "left", bold: true, italic: true, titleCase: true, runIn: false, indentDxa: 0 },
    },
    tables: {
      numberBoldAbove: true,
      titleItalicBelow: true,
      academicBorders: true,
      notesBelow: true,
    },
    figures: {
      numberBoldAbove: true,
      titleItalicBelow: true,
      notesBelow: true,
    },
    references: {
      newSectionPageBreak: true,
      headingText: "References",
      headingAlignment: "center",
      headingBold: true,
      hangingIndentDxa: HALF_INCH_DXA,
      lineSpacing: 360,
      alphabeticalSort: true,
      normalizeDoi: true,
    },
    adfSpecifics: {
      retainWatermark: true,
      retainHeaderLogo: true,
      retainFirstPageFooterAffiliations: false,
      enforceAdfSections: false,
    },
  },
};

/**
 * Resolves a profile based on requested profile ID or publication type.
 */
export function resolveProfile(
  profileId?: string,
  publicationType?: string
): FormattingProfileConfig {
  if (profileId && PROFILES[profileId as DocumentProfile]) {
    return { ...PROFILES[profileId as DocumentProfile] };
  }

  const pubLower = (publicationType || "").toLowerCase();
  if (pubLower.includes("literary") || pubLower.includes("poem") || pubLower.includes("story") || pubLower.includes("essay")) {
    return { ...PROFILES["adf-literary"] };
  }
  if (pubLower.includes("student")) {
    return { ...PROFILES["apa-7-student"] };
  }
  if (pubLower.includes("professional")) {
    return { ...PROFILES["apa-7-professional"] };
  }

  // Default for ADF workflow: ADF Academic
  return { ...PROFILES["adf-academic"] };
}

