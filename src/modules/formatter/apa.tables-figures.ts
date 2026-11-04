import { DetectedTable, DetectedFigure } from "./apa.types.js";
import { toApaTitleCase } from "./apa.headings.js";

/**
 * Extracts and standardizes tables and figures according to APA 7th Edition:
 * - Table number bold above, title italic below
 * - Figure number bold above, title italic below
 * - Table/figure notes italic "*Note.*" below
 * - Validates in-text callouts (e.g. "Table 1", "see Figure 1")
 */

export function detectTablesAndFigures(
  rawLines: string[],
  htmlTables: string[][][],
  fullText: string
): {
  tables: DetectedTable[];
  figures: DetectedFigure[];
  uncalledTables: number[];
  uncalledFigures: number[];
} {
  const tables: DetectedTable[] = [];
  const figures: DetectedFigure[] = [];

  // Table matching patterns:
  // "Table 1: Participant Characteristics" or "Table 1. Title" or split "Table 1" followed by title
  const tableNumRegex = /^Table\s+(\d+)[:.]?\s*(.*)$/i;
  const figureNumRegex = /^(?:Figure|Fig\.)\s+(\d+)[:.]?\s*(.*)$/i;
  const noteRegex = /^(?:Note|Notes)[:.]?\s*(.*)$/i;

  let tblIdx = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();

    // 1. Table Detection
    const tblMatch = line.match(tableNumRegex);
    if (tblMatch) {
      tblIdx++;
      const num = parseInt(tblMatch[1], 10) || tblIdx;
      let title = tblMatch[2] ? tblMatch[2].trim() : "";

      // If title was on the next line (common in APA manuscripts)
      if (!title && i + 1 < rawLines.length && !tableNumRegex.test(rawLines[i + 1]) && !figureNumRegex.test(rawLines[i + 1])) {
        title = rawLines[i + 1].trim();
      }

      if (!title) title = "Table Content and Metrics";

      // Look ahead for table notes
      let notes: string | undefined;
      for (let j = i + 1; j < Math.min(i + 8, rawLines.length); j++) {
        const noteMatch = rawLines[j].match(noteRegex);
        if (noteMatch) {
          notes = noteMatch[1] ? noteMatch[1].trim() : rawLines[j];
          break;
        }
      }

      const rows = htmlTables[tables.length] || [];
      const calloutRegex = new RegExp(`\\bTable\\s+${num}\\b`, "i");
      // Search fullText excluding the current caption line
      const otherText = fullText.replace(line, "");
      const mentionedInText = calloutRegex.test(otherText);

      tables.push({
        number: num,
        caption: `Table ${num}`,
        title: toApaTitleCase(title),
        hasCaption: true,
        rows,
        mentionedInText,
        notes,
        placementValid: true,
      });
    }

    // 2. Figure Detection
    const figMatch = line.match(figureNumRegex);
    if (figMatch) {
      const num = parseInt(figMatch[1], 10) || (figures.length + 1);
      let title = figMatch[2] ? figMatch[2].trim() : "";

      if (!title && i + 1 < rawLines.length && !tableNumRegex.test(rawLines[i + 1]) && !figureNumRegex.test(rawLines[i + 1])) {
        title = rawLines[i + 1].trim();
      }

      if (!title) title = "Figure Diagram or Chart";

      let notes: string | undefined;
      for (let j = i + 1; j < Math.min(i + 8, rawLines.length); j++) {
        const noteMatch = rawLines[j].match(noteRegex);
        if (noteMatch) {
          notes = noteMatch[1] ? noteMatch[1].trim() : rawLines[j];
          break;
        }
      }

      const isExternal = /source|adapted\s+from|reproduced|copyright|courtesy\s+of/i.test(line + " " + (notes || ""));
      const calloutRegex = new RegExp(`\\b(?:Figure|Fig\\.)\\s+${num}\\b`, "i");
      const otherText = fullText.replace(line, "");
      const mentionedInText = calloutRegex.test(otherText);

      figures.push({
        number: num,
        caption: `Figure ${num}`,
        title: toApaTitleCase(title),
        hasCaption: true,
        hasImage: true,
        isExternal,
        mentionedInText,
        notes,
        placementValid: true,
      });
    }
  }

  // If htmlTables exist but no table captions were parsed, create entries for them
  if (tables.length === 0 && htmlTables.length > 0) {
    htmlTables.forEach((rows, idx) => {
      const num = idx + 1;
      const calloutRegex = new RegExp(`\\bTable\\s+${num}\\b`, "i");
      const mentionedInText = calloutRegex.test(fullText);
      tables.push({
        number: num,
        caption: `Table ${num}`,
        title: `Table ${num} Data Summary`,
        hasCaption: false,
        rows,
        mentionedInText,
        placementValid: true,
      });
    });
  }

  const uncalledTables = tables.filter((t) => !t.mentionedInText).map((t) => t.number);
  const uncalledFigures = figures.filter((f) => !f.mentionedInText).map((f) => f.number);

  return {
    tables,
    figures,
    uncalledTables,
    uncalledFigures,
  };
}

