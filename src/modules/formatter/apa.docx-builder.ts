import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  Header,
  PageNumber,
  Packer,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
} from "docx";
import {
  DetectedStructure,
  FormattingProfileConfig,
  HeadingInfo,
  ParsedReference,
} from "./apa.types.js";
import { getMasterTemplatePath } from "./formatter.engine.js";
import { toApaTitleCase } from "./apa.headings.js";

function escapeXml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Builds the standardized DOCX according to the chosen profile and APA 7th Edition rules.
 */
export async function buildStandardizedDocx(
  structure: DetectedStructure,
  paragraphs: string[],
  htmlTables: string[][][],
  profile: FormattingProfileConfig
): Promise<Buffer> {
  const masterPath = getMasterTemplatePath();

  // If ADF Academic profile is requested and the master template is available, use template-based OpenXML
  if (profile.id === "adf-academic" && masterPath && fs.existsSync(masterPath)) {
    try {
      const zip = new AdmZip(masterPath);
      const originalDocXml = zip.readAsText("word/document.xml");
      const originalFooter3Xml = zip.readAsText("word/footer3.xml");
      const originalHeader2Xml = zip.readAsText("word/header2.xml");

      // 1. Build document XML with APA 7 paragraph spacing, margins, 5 heading levels, tables, figures
      const newDocXml = buildAdfOpenXmlDocument(structure, paragraphs, htmlTables, originalDocXml, profile);

      // 2. Build first-page affiliations footer XML
      const newFooterXml = buildAdfFooterXml(structure, originalFooter3Xml);

      // 3. Inject top-right Word page number into running header (header2.xml)
      const newHeader2Xml = buildAdfHeaderWithPageNumber(originalHeader2Xml, profile);

      zip.updateFile("word/document.xml", Buffer.from(newDocXml, "utf8"));
      if (newFooterXml) zip.updateFile("word/footer3.xml", Buffer.from(newFooterXml, "utf8"));
      if (newHeader2Xml) zip.updateFile("word/header2.xml", Buffer.from(newHeader2Xml, "utf8"));

      return zip.toBuffer();
    } catch (err) {
      console.error("Error using ADF master template, falling back to clean APA docx generator:", err);
    }
  }

  // Programmatic generation for APA 7 Student, APA 7 Professional, ADF Literary, or fallback
  return buildProgrammaticApaDocx(structure, paragraphs, htmlTables, profile);
}

/**
 * Updates ADF running header (header2.xml) with Word page number field in top right.
 */
function buildAdfHeaderWithPageNumber(headerXml: string, profile: FormattingProfileConfig): string {
  if (!headerXml) return "";
  const pageNumberXml = `
    <w:p>
      <w:pPr>
        <w:spacing w:line="240" w:lineRule="auto"/>
        <w:jc w:val="right"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="${profile.font}" w:hAnsi="${profile.font}"/>
          <w:sz w:val="${profile.fontSizePt * 2}"/>
        </w:rPr>
        <w:fldSimple w:instr="PAGE"/>
      </w:r>
    </w:p>
  `;

  // Insert before </w:hdr>
  return headerXml.replace("</w:hdr>", `${pageNumberXml}</w:hdr>`);
}

/**
 * Builds first page footer for ADF Academic template with author affiliations.
 */
function buildAdfFooterXml(structure: DetectedStructure, templateFooterXml: string): string {
  if (!templateFooterXml) return "";

  const correspondenceEmail = structure.correspondingEmail || structure.emailAddresses[0] || "author@adf.org";
  let affiliationsParagraphXml = "";

  if (structure.parsedAffiliations && structure.parsedAffiliations.length > 0) {
    affiliationsParagraphXml = structure.parsedAffiliations
      .map((affil, idx) => {
        const num = affil.num || (idx + 1).toString();
        return `
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
              <w:sz w:val="16"/>
              <w:vertAlign w:val="superscript"/>
            </w:rPr>
            <w:t xml:space="preserve">${escapeXml(num)} </w:t>
          </w:r>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
              <w:sz w:val="16"/>
            </w:rPr>
            <w:t xml:space="preserve">${escapeXml(affil.text)}${idx < structure.parsedAffiliations!.length - 1 ? " | " : ""}</w:t>
          </w:r>
        `;
      })
      .join("");
  } else {
    affiliationsParagraphXml = `
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="16"/>
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(structure.affiliations.join(" | ") || "Department and Institution Affiliation")}</w:t>
      </w:r>
    `;
  }

  const newFooterBody = `
    <w:p>
      <w:pPr>
        <w:spacing w:line="200" w:lineRule="auto"/>
        <w:jc w:val="both"/>
      </w:pPr>
      ${affiliationsParagraphXml}
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:b/>
          <w:sz w:val="16"/>
        </w:rPr>
        <w:t xml:space="preserve"> | * Correspondence: </w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="16"/>
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(correspondenceEmail)}</w:t>
      </w:r>
    </w:p>
  `;

  const ftrOpenMatch = templateFooterXml.match(/<w:ftr\b[^>]*>/);
  if (!ftrOpenMatch) return templateFooterXml;
  return `${ftrOpenMatch[0]}${newFooterBody}</w:ftr>`;
}

/**
 * Builds OpenXML document for ADF Academic profile integrating APA 7 styling.
 */
function buildAdfOpenXmlDocument(
  structure: DetectedStructure,
  paragraphs: string[],
  htmlTables: string[][][],
  templateDocXml: string,
  profile: FormattingProfileConfig
): string {
  const bodyStart = templateDocXml.indexOf("<w:body>") + "<w:body>".length;
  const sectPrMatch = templateDocXml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/);

  if (!sectPrMatch) {
    throw new Error("Invalid master template: <w:sectPr> not found in document.xml");
  }

  const prefix = templateDocXml.substring(0, bodyStart);
  // Configure A4 paper size in sectPr: 11906 x 16838 dxa
  let customizedSectPr = sectPrMatch[0];
  customizedSectPr = customizedSectPr.replace(
    /<w:pgSz\b[^>]*\/>/,
    `<w:pgSz w:w="${profile.pageSizeDxa.width}" w:h="${profile.pageSizeDxa.height}"/>`
  );
  customizedSectPr = customizedSectPr.replace(
    /<w:pgMar\b[^>]*\/>/,
    `<w:pgMar w:top="${profile.marginsDxa.top}" w:right="${profile.marginsDxa.right}" w:bottom="${profile.marginsDxa.bottom}" w:left="${profile.marginsDxa.left}" w:header="${profile.marginsDxa.header}" w:footer="${profile.marginsDxa.footer}" w:gutter="0"/>`
  );

  const suffix = customizedSectPr + "</w:body></w:document>";
  const xmlParagraphs: string[] = [];

  const font = profile.font;
  const bodySz = (profile.fontSizePt * 2).toString();
  const lineSpacingDxa = profile.lineSpacing.toString();
  const indentDxa = profile.paragraphIndentDxa.toString();
  const alignJc = profile.paragraphAlignment; // "left" or "both"

  // 1. Title: 16pt Bold Center
  xmlParagraphs.push(`
    <w:p>
      <w:pPr>
        <w:spacing w:before="240" w:after="240"/>
        <w:jc w:val="center"/>
        <w:keepNext/>
        <w:rPr>
          <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
          <w:b/>
          <w:sz w:val="32"/>
        </w:rPr>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
          <w:b/>
          <w:sz w:val="32"/>
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(toApaTitleCase(structure.title))}</w:t>
      </w:r>
    </w:p>
  `);

  // 2. Authors
  const authorsRuns = (structure.parsedAuthors && structure.parsedAuthors.length > 0
    ? structure.parsedAuthors.map((author, index) => {
        const num = author.num || (index + 1).toString();
        const mark = `${num}${author.star ? " *" : ""}`;
        return `
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
              <w:b/>
              <w:sz w:val="20"/>
            </w:rPr>
            <w:t xml:space="preserve">${index > 0 ? ", " : ""}${escapeXml(author.name)} </w:t>
          </w:r>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
              <w:b/>
              <w:sz w:val="20"/>
              <w:vertAlign w:val="superscript"/>
            </w:rPr>
            <w:t>${escapeXml(mark)}</w:t>
          </w:r>
        `;
      })
    : structure.authors.map((author, index) => {
        return `
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
              <w:b/>
              <w:sz w:val="20"/>
            </w:rPr>
            <w:t xml:space="preserve">${index > 0 ? ", " : ""}${escapeXml(author)} </w:t>
          </w:r>
        `;
      })
  ).join("");

  xmlParagraphs.push(`
    <w:p>
      <w:pPr>
        <w:spacing w:before="120" w:after="240" w:line="${lineSpacingDxa}" w:lineRule="auto"/>
        <w:jc w:val="both"/>
        <w:keepNext/>
      </w:pPr>
      ${authorsRuns}
    </w:p>
  `);

  // 3. Abstract (Level 1 Centered Bold per APA 7)
  if (structure.abstract) {
    xmlParagraphs.push(`
      <w:p>
        <w:pPr>
          <w:spacing w:before="240" w:after="120" w:line="${lineSpacingDxa}" w:lineRule="auto"/>
          <w:jc w:val="center"/>
          <w:keepNext/>
          <w:rPr>
            <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
            <w:b/>
            <w:sz w:val="${bodySz}"/>
          </w:rPr>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
            <w:b/>
            <w:sz w:val="${bodySz}"/>
          </w:rPr>
          <w:t>Abstract</w:t>
        </w:r>
      </w:p>
      <w:p>
        <w:pPr>
          <w:spacing w:line="${lineSpacingDxa}" w:lineRule="auto"/>
          <w:ind w:firstLine="0"/>
          <w:jc w:val="${alignJc}"/>
          <w:rPr>
            <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
            <w:sz w:val="${bodySz}"/>
          </w:rPr>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
            <w:sz w:val="${bodySz}"/>
          </w:rPr>
          <w:t xml:space="preserve">${escapeXml(structure.abstract)}</w:t>
        </w:r>
      </w:p>
    `);
  }

  // 4. Keywords
  if (structure.keywords && structure.keywords.length > 0) {
    xmlParagraphs.push(`
      <w:p>
        <w:pPr>
          <w:spacing w:before="120" w:after="240" w:line="${lineSpacingDxa}" w:lineRule="auto"/>
          <w:ind w:firstLine="${indentDxa}"/>
          <w:jc w:val="${alignJc}"/>
          <w:rPr>
            <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
            <w:sz w:val="${bodySz}"/>
          </w:rPr>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
            <w:i/>
            <w:sz w:val="${bodySz}"/>
          </w:rPr>
          <w:t>Keywords:</w:t>
        </w:r>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
            <w:sz w:val="${bodySz}"/>
          </w:rPr>
          <w:t xml:space="preserve"> ${escapeXml(structure.keywords.join("; "))}</w:t>
        </w:r>
      </w:p>
    `);
  }

  // 5. Body paragraphs & Sections
  const tableCellSet = new Set<string>();
  htmlTables.forEach((tbl) => {
    tbl.forEach((row) => {
      row.forEach((cell) => {
        const text = cell.trim().toLowerCase();
        if (text) tableCellSet.add(text);
      });
    });
  });

  const skipKeywordsIndex = paragraphs.findIndex((p) => /^keywords?\b/i.test(p));
  const startIndex = skipKeywordsIndex !== -1 ? skipKeywordsIndex + 1 : 4;
  const refHeadingIndex = paragraphs.findIndex((p) => /^(references|bibliography)\b/i.test(p));
  const mainParagraphs = paragraphs.slice(
    startIndex,
    refHeadingIndex !== -1 ? refHeadingIndex : paragraphs.length
  );

  let tableIndex = 0;
  let figureIndex = 0;

  for (let idx = 0; idx < mainParagraphs.length; idx++) {
    const pText = mainParagraphs[idx].trim();
    if (!pText) continue;

    // Filter table cells
    if (tableCellSet.has(pText.toLowerCase())) continue;

    // Table caption
    if (/^Table\s+\d+/i.test(pText)) {
      const detectedTable = structure.tables?.[tableIndex] || {
        number: tableIndex + 1,
        title: "Table Metrics",
        notes: undefined,
      };
      // APA 7 Table: Table number Bold above, Title Italic below
      xmlParagraphs.push(`
        <w:p>
          <w:pPr>
            <w:spacing w:before="240" w:after="0" w:line="${lineSpacingDxa}" w:lineRule="auto"/>
            <w:jc w:val="left"/>
            <w:keepNext/>
            <w:rPr>
              <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
              <w:b/>
              <w:sz w:val="${bodySz}"/>
            </w:rPr>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
              <w:b/>
              <w:sz w:val="${bodySz}"/>
            </w:rPr>
            <w:t>Table ${detectedTable.number}</w:t>
          </w:r>
        </w:p>
        <w:p>
          <w:pPr>
            <w:spacing w:before="0" w:after="120" w:line="${lineSpacingDxa}" w:lineRule="auto"/>
            <w:jc w:val="left"/>
            <w:keepNext/>
            <w:rPr>
              <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
              <w:i/>
              <w:sz w:val="${bodySz}"/>
            </w:rPr>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
              <w:i/>
              <w:sz w:val="${bodySz}"/>
            </w:rPr>
            <w:t xml:space="preserve">${escapeXml(toApaTitleCase(detectedTable.title))}</w:t>
          </w:r>
        </w:p>
      `);

      if (htmlTables[tableIndex]) {
        xmlParagraphs.push(generateOpenXmlTableApa(htmlTables[tableIndex], font));
      }

      if (detectedTable.notes) {
        xmlParagraphs.push(`
          <w:p>
            <w:pPr>
              <w:spacing w:before="120" w:after="240" w:line="${lineSpacingDxa}" w:lineRule="auto"/>
              <w:jc w:val="left"/>
              <w:rPr>
                <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
                <w:sz w:val="20"/>
              </w:rPr>
            </w:pPr>
            <w:r>
              <w:rPr>
                <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
                <w:i/>
                <w:sz w:val="20"/>
              </w:rPr>
              <w:t>Note. </w:t>
            </w:r>
            <w:r>
              <w:rPr>
                <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
                <w:sz w:val="20"/>
              </w:rPr>
              <w:t xml:space="preserve">${escapeXml(detectedTable.notes)}</w:t>
            </w:r>
          </w:p>
        `);
      }

      tableIndex++;
      continue;
    }

    // Figure caption
    if (/^(?:Figure|Fig\.)\s+\d+/i.test(pText)) {
      const detectedFig = structure.figures?.[figureIndex] || {
        number: figureIndex + 1,
        title: "Figure Chart",
        notes: undefined,
      };

      xmlParagraphs.push(`
        <w:p>
          <w:pPr>
            <w:spacing w:before="240" w:after="0" w:line="${lineSpacingDxa}" w:lineRule="auto"/>
            <w:jc w:val="left"/>
            <w:keepNext/>
            <w:rPr>
              <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
              <w:b/>
              <w:sz w:val="${bodySz}"/>
            </w:rPr>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
              <w:b/>
              <w:sz w:val="${bodySz}"/>
            </w:rPr>
            <w:t>Figure ${detectedFig.number}</w:t>
          </w:r>
        </w:p>
        <w:p>
          <w:pPr>
            <w:spacing w:before="0" w:after="120" w:line="${lineSpacingDxa}" w:lineRule="auto"/>
            <w:jc w:val="left"/>
            <w:keepNext/>
            <w:rPr>
              <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
              <w:i/>
              <w:sz w:val="${bodySz}"/>
            </w:rPr>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
              <w:i/>
              <w:sz w:val="${bodySz}"/>
            </w:rPr>
            <w:t xml:space="preserve">${escapeXml(toApaTitleCase(detectedFig.title))}</w:t>
          </w:r>
        </w:p>
      `);

      figureIndex++;
      continue;
    }

    // Check if paragraph matches any detected heading
    const matchedHeading = structure.headings.find((h) => h.originalText === pText || h.text === toApaTitleCase(pText));
    if (matchedHeading) {
      xmlParagraphs.push(buildOpenXmlHeading(matchedHeading, font, bodySz, lineSpacingDxa));
      continue;
    }

    // Standard Body Paragraph: 0.5" first line indent, lineSpacing, alignJc
    xmlParagraphs.push(`
      <w:p>
        <w:pPr>
          <w:spacing w:line="${lineSpacingDxa}" w:lineRule="auto"/>
          <w:ind w:firstLine="${indentDxa}"/>
          <w:jc w:val="${alignJc}"/>
          <w:widowControl/>
          <w:rPr>
            <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
            <w:sz w:val="${bodySz}"/>
          </w:rPr>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
            <w:sz w:val="${bodySz}"/>
          </w:rPr>
          <w:t xml:space="preserve">${escapeXml(pText)}</w:t>
        </w:r>
      </w:p>
    `);
  }

  // 6. APA References (Starts on a new page)
  if (structure.references && structure.references.length > 0) {
    xmlParagraphs.push(`
      <w:p>
        <w:pPr>
          <w:spacing w:before="240" w:after="240" w:line="${lineSpacingDxa}" w:lineRule="auto"/>
          <w:jc w:val="center"/>
          <w:keepNext/>
          <w:pageBreakBefore/>
          <w:rPr>
            <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
            <w:b/>
            <w:sz w:val="${bodySz}"/>
          </w:rPr>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
            <w:b/>
            <w:sz w:val="${bodySz}"/>
          </w:rPr>
          <w:t>References</w:t>
        </w:r>
      </w:p>
    `);

    // Sorted references with 0.5-inch hanging indent
    const sortedRefs = [...structure.references];
    sortedRefs.forEach((ref) => {
      xmlParagraphs.push(`
        <w:p>
          <w:pPr>
            <w:spacing w:line="${lineSpacingDxa}" w:lineRule="auto"/>
            <w:ind w:left="${indentDxa}" w:hanging="${indentDxa}"/>
            <w:jc w:val="left"/>
            <w:widowControl/>
            <w:rPr>
              <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
              <w:sz w:val="${bodySz}"/>
            </w:rPr>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
              <w:sz w:val="${bodySz}"/>
            </w:rPr>
            <w:t xml:space="preserve">${escapeXml(ref)}</w:t>
          </w:r>
        </w:p>
      `);
    });
  }

  return prefix + xmlParagraphs.join("") + suffix;
}

/**
 * Builds OpenXML for the 5 APA Heading Levels.
 */
function buildOpenXmlHeading(h: HeadingInfo, font: string, bodySz: string, lineSpacing: string): string {
  const titleText = escapeXml(h.text);
  const runInText = h.runInText ? escapeXml(h.runInText) : "";

  switch (h.level) {
    case 1:
      // Level 1: Centered, Bold, Title Case
      return `
        <w:p>
          <w:pPr>
            <w:spacing w:before="240" w:after="120" w:line="${lineSpacing}" w:lineRule="auto"/>
            <w:jc w:val="center"/>
            <w:keepNext/>
            <w:rPr>
              <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
              <w:b/>
              <w:sz w:val="${bodySz}"/>
            </w:rPr>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
              <w:b/>
              <w:sz w:val="${bodySz}"/>
            </w:rPr>
            <w:t xml:space="preserve">${titleText}</w:t>
          </w:r>
        </w:p>
      `;
    case 2:
      // Level 2: Flush Left, Bold, Title Case
      return `
        <w:p>
          <w:pPr>
            <w:spacing w:before="240" w:after="120" w:line="${lineSpacing}" w:lineRule="auto"/>
            <w:jc w:val="left"/>
            <w:keepNext/>
            <w:rPr>
              <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
              <w:b/>
              <w:sz w:val="${bodySz}"/>
            </w:rPr>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
              <w:b/>
              <w:sz w:val="${bodySz}"/>
            </w:rPr>
            <w:t xml:space="preserve">${titleText}</w:t>
          </w:r>
        </w:p>
      `;
    case 3:
      // Level 3: Flush Left, Bold Italic, Title Case
      return `
        <w:p>
          <w:pPr>
            <w:spacing w:before="240" w:after="120" w:line="${lineSpacing}" w:lineRule="auto"/>
            <w:jc w:val="left"/>
            <w:keepNext/>
            <w:rPr>
              <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
              <w:b/>
              <w:i/>
              <w:sz w:val="${bodySz}"/>
            </w:rPr>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
              <w:b/>
              <w:i/>
              <w:sz w:val="${bodySz}"/>
            </w:rPr>
            <w:t xml:space="preserve">${titleText}</w:t>
          </w:r>
        </w:p>
      `;
    case 4:
      // Level 4: Indented 0.5", Bold, Title Case, Ending With a Period. Text continues on same line.
      return `
        <w:p>
          <w:pPr>
            <w:spacing w:line="${lineSpacing}" w:lineRule="auto"/>
            <w:ind w:firstLine="720"/>
            <w:jc w:val="left"/>
            <w:rPr>
              <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
              <w:sz w:val="${bodySz}"/>
            </w:rPr>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
              <w:b/>
              <w:sz w:val="${bodySz}"/>
            </w:rPr>
            <w:t xml:space="preserve">${titleText}${titleText.endsWith(".") ? "" : "."} </w:t>
          </w:r>
          ${runInText ? `
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
              <w:sz w:val="${bodySz}"/>
            </w:rPr>
            <w:t xml:space="preserve">${runInText}</w:t>
          </w:r>` : ""}
        </w:p>
      `;
    case 5:
      // Level 5: Indented 0.5", Bold Italic, Title Case, Ending With a Period. Text continues on same line.
      return `
        <w:p>
          <w:pPr>
            <w:spacing w:line="${lineSpacing}" w:lineRule="auto"/>
            <w:ind w:firstLine="720"/>
            <w:jc w:val="left"/>
            <w:rPr>
              <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
              <w:sz w:val="${bodySz}"/>
            </w:rPr>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
              <w:b/>
              <w:i/>
              <w:sz w:val="${bodySz}"/>
            </w:rPr>
            <w:t xml:space="preserve">${titleText}${titleText.endsWith(".") ? "" : "."} </w:t>
          </w:r>
          ${runInText ? `
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
              <w:sz w:val="${bodySz}"/>
            </w:rPr>
            <w:t xml:space="preserve">${runInText}</w:t>
          </w:r>` : ""}
        </w:p>
      `;
  }
}

/**
 * Generates an OpenXML table adhering to APA 7th Edition:
 * Horizontal lines above and below the column headings, and below the table. No vertical borders.
 */
function generateOpenXmlTableApa(tableRows: string[][], font: string): string {
  if (!tableRows || tableRows.length === 0) return "";
  const numCols = Math.max(...tableRows.map((r) => r.length));
  const colWidth = Math.floor(8865 / (numCols || 1));
  const gridCols = Array.from({ length: numCols }, () => `<w:gridCol w:w="${colWidth}"/>`).join("");

  const rowsXml = tableRows
    .map((row, rIdx) => {
      const isHeader = rIdx === 0;
      const isLast = rIdx === tableRows.length - 1;

      const cellsXml = row
        .map((cellText, cIdx) => {
          const isLeftCol = cIdx === 0;
          return `
            <w:tc>
              <w:tcPr>
                <w:tcW w:w="${colWidth}" w:type="dxa"/>
                <w:tcBorders>
                  ${isHeader ? '<w:top w:val="single" w:sz="8" w:space="0" w:color="000000"/>' : '<w:top w:val="none"/>'}
                  ${isHeader || isLast ? '<w:bottom w:val="single" w:sz="8" w:space="0" w:color="000000"/>' : '<w:bottom w:val="none"/>'}
                  <w:left w:val="none"/>
                  <w:right w:val="none"/>
                </w:tcBorders>
              </w:tcPr>
              <w:p>
                <w:pPr>
                  <w:spacing w:before="60" w:after="60"/>
                  <w:jc w:val="${isLeftCol ? "left" : "center"}"/>
                  <w:rPr>
                    <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
                    ${isHeader ? "<w:b/>" : ""}
                    <w:sz w:val="20"/>
                  </w:rPr>
                </w:pPr>
                <w:r>
                  <w:rPr>
                    <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
                    ${isHeader ? "<w:b/>" : ""}
                    <w:sz w:val="20"/>
                  </w:rPr>
                  <w:t xml:space="preserve">${escapeXml(cellText)}</w:t>
                </w:r>
              </w:p>
            </w:tc>
          `;
        })
        .join("");

      return `<w:tr><w:trPr>${isHeader ? "<w:tblHeader/>" : ""}<w:cantSplit/></w:trPr>${cellsXml}</w:tr>`;
    })
    .join("");

  return `
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="8865" w:type="dxa"/>
        <w:jc w:val="center"/>
        <w:tblBorders>
          <w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/>
          <w:insideH w:val="none"/><w:insideV w:val="none"/>
        </w:tblBorders>
        <w:tblLayout w:type="fixed"/>
      </w:tblPr>
      <w:tblGrid>${gridCols}</w:tblGrid>
      ${rowsXml}
    </w:tbl>
  `;
}

/**
 * Programmatic generator using `docx` package for APA Student, Professional, Literary, or fallback.
 */
async function buildProgrammaticApaDocx(
  structure: DetectedStructure,
  paragraphs: string[],
  htmlTables: string[][][],
  profile: FormattingProfileConfig
): Promise<Buffer> {
  const font = profile.font;
  const isStudent = profile.id === "apa-7-student";
  const isProfessional = profile.id === "apa-7-professional";
  const docChildren: any[] = [];

  // 1. Header with Page Number (top right on every page)
  const headerChildren: Paragraph[] = [];
  if (isProfessional && profile.runningHead.enabled) {
    const runningHeadTitle = (structure.title || "TITLE OF MANUSCRIPT").slice(0, 50).toUpperCase();
    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.BOTH,
        children: [
          new TextRun({ text: runningHeadTitle, font, size: 24 }),
          new TextRun({ text: "\t\t", font, size: 24 }),
          new TextRun({ children: [PageNumber.CURRENT], font, size: 24 }),
        ],
      })
    );
  } else {
    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ children: [PageNumber.CURRENT], font, size: 24 })],
      })
    );
  }

  // 2. Title Page
  if (isStudent) {
    // APA Student Paper:
    // Place title 3 or 4 blank double-spaced lines down from top
    docChildren.push(new Paragraph({ spacing: { line: 480, before: 0, after: 0 } }));
    docChildren.push(new Paragraph({ spacing: { line: 480, before: 0, after: 0 } }));
    docChildren.push(new Paragraph({ spacing: { line: 480, before: 0, after: 0 } }));

    // Paper Title: Bold, Centered, Title Case
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 480, before: 0, after: 0 },
        children: [new TextRun({ text: toApaTitleCase(structure.title), bold: true, font, size: 24 })],
      })
    );

    // One extra blank double-spaced line between title and authors (Page 3 of Setup Guide)
    docChildren.push(new Paragraph({ spacing: { line: 480, before: 0, after: 0 } }));

    // Author names: Centered, standard font
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 480, before: 0, after: 0 },
        children: [new TextRun({ text: structure.authors.join(", ") || "Author Name", font, size: 24 })],
      })
    );

    // Affiliation: Department and University
    const affilText = structure.affiliations.join(", ") || "Department and Institution";
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 480, before: 0, after: 0 },
        children: [new TextRun({ text: affilText, font, size: 24 })],
      })
    );

    // Course number and name
    if (structure.courseInfo) {
      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { line: 480, before: 0, after: 0 },
          children: [new TextRun({ text: structure.courseInfo, font, size: 24 })],
        })
      );
    }

    // Instructor name
    if (structure.instructorName) {
      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { line: 480, before: 0, after: 0 },
          children: [new TextRun({ text: structure.instructorName, font, size: 24 })],
        })
      );
    }

    // Assignment Due Date
    if (structure.dueDate) {
      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { line: 480, before: 0, after: 0 },
          children: [new TextRun({ text: structure.dueDate, font, size: 24 })],
        })
      );
    }

    // Page break to Page 2 (Text begins)
    docChildren.push(
      new Paragraph({
        pageBreakBefore: true,
        alignment: AlignmentType.CENTER,
        spacing: { line: 480, before: 0, after: 0 },
        children: [new TextRun({ text: toApaTitleCase(structure.title), bold: true, font, size: 24 })],
      })
    );
  } else if (isProfessional) {
    // Professional Title Page
    docChildren.push(new Paragraph({ spacing: { line: 480, before: 0, after: 0 } }));
    docChildren.push(new Paragraph({ spacing: { line: 480, before: 0, after: 0 } }));
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 480, before: 0, after: 0 },
        children: [new TextRun({ text: toApaTitleCase(structure.title), bold: true, font, size: 24 })],
      })
    );
    docChildren.push(new Paragraph({ spacing: { line: 480, before: 0, after: 0 } }));
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 480, before: 0, after: 0 },
        children: [new TextRun({ text: structure.authors.join(", ") || "Author Name", font, size: 24 })],
      })
    );
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 480, before: 0, after: 0 },
        children: [new TextRun({ text: structure.affiliations.join(", ") || "Institution Affiliation", font, size: 24 })],
      })
    );

    // Page break to Page 2 (Abstract & Text)
    docChildren.push(new Paragraph({ pageBreakBefore: true }));
  }

  // 3. Abstract
  if (structure.abstract) {
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 480, before: 240, after: 120 },
        children: [new TextRun({ text: "Abstract", bold: true, font, size: 24 })],
      })
    );
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 480, before: 0, after: 0 },
        indent: { firstLine: 0 }, // Abstract body is not indented in APA
        children: [new TextRun({ text: structure.abstract, font, size: 24 })],
      })
    );

    if (structure.keywords && structure.keywords.length > 0) {
      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { line: 480, before: 120, after: 240 },
          indent: { firstLine: 720 },
          children: [
            new TextRun({ text: "Keywords: ", italics: true, font, size: 24 }),
            new TextRun({ text: structure.keywords.join(", "), font, size: 24 }),
          ],
        })
      );
    }

    // Page break after abstract if professional paper
    if (isProfessional) {
      docChildren.push(
        new Paragraph({
          pageBreakBefore: true,
          alignment: AlignmentType.CENTER,
          spacing: { line: 480, before: 0, after: 0 },
          children: [new TextRun({ text: toApaTitleCase(structure.title), bold: true, font, size: 24 })],
        })
      );
    }
  }

  // 4. Body Paragraphs & Headings
  paragraphs.forEach((p) => {
    const trimmed = p.trim();
    if (!trimmed) return;

    const matchedHeading = structure.headings.find((h) => h.originalText === trimmed || h.text === toApaTitleCase(trimmed));
    if (matchedHeading) {
      docChildren.push(buildDocxHeading(matchedHeading, font));
      return;
    }

    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 480, before: 0, after: 0 },
        indent: { firstLine: 720 },
        children: [new TextRun({ text: trimmed, font, size: 24 })],
      })
    );
  });

  // 5. Tables
  let tIdx = 0;
  structure.tables?.forEach((tbl) => {
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 480, before: 240, after: 0 },
        children: [new TextRun({ text: `Table ${tbl.number}`, bold: true, font, size: 24 })],
      })
    );
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 480, before: 0, after: 120 },
        children: [new TextRun({ text: toApaTitleCase(tbl.title), italics: true, font, size: 24 })],
      })
    );

    const rowsData = htmlTables[tIdx] || tbl.rows || [];
    if (rowsData.length > 0) {
      const numCols = Math.max(...rowsData.map((r) => r.length));
      const colWidth = Math.floor(9000 / (numCols || 1));

      const docxRows = rowsData.map((row, rIdx) => {
        const isHeader = rIdx === 0;
        const isLast = rIdx === rowsData.length - 1;

        return new TableRow({
          tableHeader: isHeader,
          cantSplit: true,
          children: row.map((cellText, cIdx) => {
            return new TableCell({
              width: { size: colWidth, type: WidthType.DXA },
              borders: {
                top: isHeader ? { style: BorderStyle.SINGLE, size: 8, color: "000000" } : { style: BorderStyle.NONE },
                bottom: isHeader || isLast ? { style: BorderStyle.SINGLE, size: 8, color: "000000" } : { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  alignment: cIdx === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
                  children: [new TextRun({ text: cellText, bold: isHeader, font, size: 20 })],
                }),
              ],
            });
          }),
        });
      });

      docChildren.push(new Table({ width: { size: 9000, type: WidthType.DXA }, rows: docxRows }));
    }

    if (tbl.notes) {
      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { line: 480, before: 120, after: 240 },
          children: [
            new TextRun({ text: "Note. ", italics: true, font, size: 20 }),
            new TextRun({ text: tbl.notes, font, size: 20 }),
          ],
        })
      );
    }
    tIdx++;
  });

  // 6. References
  if (structure.references && structure.references.length > 0) {
    docChildren.push(
      new Paragraph({
        pageBreakBefore: true,
        alignment: AlignmentType.CENTER,
        spacing: { line: 480, before: 240, after: 240 },
        children: [new TextRun({ text: "References", bold: true, font, size: 24 })],
      })
    );

    structure.references.forEach((ref) => {
      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { line: 480, before: 0, after: 0 },
          indent: { left: 720, hanging: 720 },
          children: [new TextRun({ text: ref, font, size: 24 })],
        })
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: profile.pageSizeDxa.width, height: profile.pageSizeDxa.height },
            margin: {
              top: profile.marginsDxa.top,
              bottom: profile.marginsDxa.bottom,
              left: profile.marginsDxa.left,
              right: profile.marginsDxa.right,
            },
          },
        },
        headers: {
          default: new Header({ children: headerChildren }),
        },
        children: docChildren,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

function buildDocxHeading(h: HeadingInfo, font: string): Paragraph {
  const titleText = toApaTitleCase(h.text);
  const runInText = h.runInText || "";

  switch (h.level) {
    case 1:
      return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 480, before: 240, after: 120 },
        children: [new TextRun({ text: titleText, bold: true, font, size: 24 })],
      });
    case 2:
      return new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 480, before: 240, after: 120 },
        children: [new TextRun({ text: titleText, bold: true, font, size: 24 })],
      });
    case 3:
      return new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 480, before: 240, after: 120 },
        children: [new TextRun({ text: titleText, bold: true, italics: true, font, size: 24 })],
      });
    case 4:
      return new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 480, before: 0, after: 0 },
        indent: { firstLine: 720 },
        children: [
          new TextRun({ text: `${titleText}${titleText.endsWith(".") ? "" : "."} `, bold: true, font, size: 24 }),
          new TextRun({ text: runInText, font, size: 24 }),
        ],
      });
    case 5:
      return new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 480, before: 0, after: 0 },
        indent: { firstLine: 720 },
        children: [
          new TextRun({ text: `${titleText}${titleText.endsWith(".") ? "" : "."} `, bold: true, italics: true, font, size: 24 }),
          new TextRun({ text: runInText, font, size: 24 }),
        ],
      });
  }
}
