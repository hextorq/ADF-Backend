export type DocumentProfile =
  | "apa-7-student"
  | "apa-7-professional"
  | "adf-academic"
  | "adf-literary";

export type ApaFont =
  | "Times New Roman"
  | "Arial"
  | "Calibri"
  | "Aptos"
  | "Georgia";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5;

export interface HeadingInfo {
  level: HeadingLevel;
  text: string;
  originalText?: string;
  isRunIn?: boolean; // For Level 4 and Level 5
  runInText?: string;
  confidence: "high" | "medium" | "low";
  reason?: string;
}

export type ReferenceType =
  | "journal"
  | "magazine-online"
  | "magazine-print"
  | "newspaper-online"
  | "newspaper-print"
  | "blog"
  | "book-authored"
  | "book-chapter"
  | "dictionary"
  | "report-group"
  | "report-individual"
  | "press-release"
  | "conference"
  | "dissertation"
  | "preprint"
  | "dataset"
  | "film"
  | "tv-episode"
  | "webinar"
  | "youtube"
  | "song"
  | "radio"
  | "podcast"
  | "infographic"
  | "powerpoint"
  | "social-post"
  | "oer"
  | "webpage"
  | "webpage-news"
  | "webpage-retrieval"
  | "unknown";

export interface ParsedReference {
  raw: string;
  formatted: string;
  type: ReferenceType;
  typeLabel: string;
  authors: string[];
  year?: string;
  dateStr?: string;
  title?: string;
  containerTitle?: string; // Journal name, book title, magazine name, website name
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  publisher?: string;
  edition?: string;
  editors?: string[];
  bracketInfo?: string; // [Film], [Data set], [Doctoral dissertation, University], etc.
  isDoiValid: boolean;
  isUrlValid: boolean;
  isAlphabetical: boolean;
  hasHangingIndent: boolean;
  confidence: "high" | "medium" | "low";
  warnings: string[];
}

export interface InTextCitation {
  raw: string;
  author: string;
  year: string;
  isNarrative: boolean;
  pageLocator?: string; // e.g. p. 45, pp. 20-25
  isEtAl: boolean;
  matchedReference?: string;
}

export interface DetectedTable {
  number: number;
  caption: string;
  title: string;
  hasCaption: boolean;
  rows: string[][];
  mentionedInText: boolean;
  notes?: string;
  placementValid: boolean;
}

export interface DetectedFigure {
  number: number;
  caption: string;
  title: string;
  hasCaption: boolean;
  imageXml?: string;
  hasImage: boolean;
  isExternal: boolean;
  mentionedInText: boolean;
  notes?: string;
  placementValid: boolean;
}

export interface ParsedAuthor {
  raw: string;
  name: string;
  num: string;
  star: string;
  department?: string;
  institution?: string;
  city?: string;
  country?: string;
  email?: string;
}

export interface ParsedAffiliation {
  num: string;
  text: string;
}

export interface StructuralDecision {
  section: string;
  detected: boolean;
  confidence: "high" | "medium" | "low";
  reason: string;
  originalHeading?: string;
  normalizedHeading?: string;
  actionTaken: string;
}

export interface DetectedStructure {
  title: string;
  titleHasAbbreviation: boolean;
  authors: string[];
  parsedAuthors?: ParsedAuthor[];
  correspondingAuthor?: string;
  affiliations: string[];
  parsedAffiliations?: ParsedAffiliation[];
  emailAddresses: string[];
  correspondingEmail?: string;
  abstract: string;
  abstractWordCount: number;
  keywords: string[];
  headings: HeadingInfo[];
  references: string[];
  parsedReferences?: ParsedReference[];
  inTextCitations?: InTextCitation[];
  citationMismatches?: string[];
  uncitedReferences?: string[];
  tables?: DetectedTable[];
  figures?: DetectedFigure[];
  structuralDecisions?: StructuralDecision[];
  confidenceBreakdown?: { high: number; medium: number; low: number };
  optionalSections?: {
    acknowledgement?: string;
    declarationOfInterest?: string;
    funding?: string;
  };
  abbreviations?: { acronym: string; defined: boolean }[];
  publicationType: string;
  profile: DocumentProfile;
  courseInfo?: string;
  instructorName?: string;
  dueDate?: string;
}

export interface ValidationItem {
  id: string;
  category: "formatting" | "references" | "tablesAndFigures" | "integrity" | "structure";
  level: "pass" | "warning" | "error";
  title: string;
  description: string;
  recommendation?: string;
}

export interface ValidationReport {
  status: "READY FOR AUTHOR REVIEW" | "REVIEW REQUIRED";
  statusLevel: "PASS" | "PASS_WITH_WARNINGS" | "ACTION_REQUIRED";
  totalChecks: number;
  passedCount: number;
  warningCount: number;
  errorCount: number;
  items: ValidationItem[];
  dashboard: {
    structure: any[];
    formatting: any[];
    contentChecks: any[];
    warnings: string[];
    finalStatus: "READY FOR AUTHOR REVIEW" | "REVIEW REQUIRED";
  };
  categories: {
    documentFormatting: { status: "pass" | "warning" | "error"; count: number; items: string[] };
    apaReferences: { status: "pass" | "warning" | "error"; count: number; items: string[]; citationMismatches: string[]; uncitedReferences: string[] };
    tablesAndFigures: { status: "pass" | "warning" | "error"; count: number; items: string[] };
    contentIntegrity: { status: "pass" | "warning" | "error"; count: number; items: string[] };
  };
}

export interface FormattingProfileConfig {
  id: DocumentProfile;
  name: string;
  description: string;
  pageSize: "A4" | "Letter";
  pageSizeDxa: { width: number; height: number };
  marginsDxa: { top: number; bottom: number; left: number; right: number; header: number; footer: number };
  font: ApaFont;
  fontSizePt: number;
  lineSpacing: number; // 480 = double, 240 = single
  paragraphIndentDxa: number; // 720 = 0.5 in
  paragraphAlignment: "left" | "both";
  pageNumbering: {
    enabled: boolean;
    position: "top-right" | "bottom-right";
    startPage: number;
    showOnTitlePage: boolean;
  };
  runningHead: {
    enabled: boolean;
    title?: string;
    maxChars: number;
  };
  titlePage: {
    type: "apa-student" | "apa-professional" | "adf-master" | "literary";
    centered: boolean;
    boldTitle: boolean;
    includeCourse: boolean;
    includeInstructor: boolean;
    includeDate: boolean;
    includeAuthorNote: boolean;
  };
  headings: {
    level1: { alignment: "center"; bold: boolean; italic: boolean; titleCase: boolean; runIn: false };
    level2: { alignment: "left"; bold: boolean; italic: boolean; titleCase: boolean; runIn: false };
    level3: { alignment: "left"; bold: boolean; italic: boolean; titleCase: boolean; runIn: false };
    level4: { alignment: "left"; bold: boolean; italic: boolean; titleCase: boolean; runIn: boolean; indentDxa: number };
    level5: { alignment: "left"; bold: boolean; italic: boolean; titleCase: boolean; runIn: boolean; indentDxa: number };
  };
  tables: {
    numberBoldAbove: boolean;
    titleItalicBelow: boolean;
    academicBorders: boolean;
    notesBelow: boolean;
  };
  figures: {
    numberBoldAbove: boolean;
    titleItalicBelow: boolean;
    notesBelow: boolean;
  };
  references: {
    newSectionPageBreak: boolean;
    headingText: string;
    headingAlignment: "center";
    headingBold: boolean;
    hangingIndentDxa: number; // 720 = 0.5 in
    lineSpacing: number; // 480 = double
    alphabeticalSort: boolean;
    normalizeDoi: boolean;
  };
  adfSpecifics: {
    retainWatermark: boolean;
    retainHeaderLogo: boolean;
    retainFirstPageFooterAffiliations: boolean;
    enforceAdfSections: boolean;
  };
}
