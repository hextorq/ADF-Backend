import {
  DetectedStructure,
  FormattingProfileConfig,
  HeadingInfo,
  ParsedReference,
} from "./apa.types.js";
import { toApaTitleCase } from "./apa.headings.js";

function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Builds high-fidelity HTML preview adhering to APA 7th Edition styling and the selected profile.
 */
export function buildApaHtmlPreview(
  structure: DetectedStructure,
  paragraphs: string[],
  htmlTables: string[][][],
  profile: FormattingProfileConfig
): string {
  const font = profile.font;
  const isStudent = profile.id === "apa-7-student";
  const isProfessional = profile.id === "apa-7-professional";
  const isAdf = profile.id === "adf-academic";
  const isLiterary = profile.id === "adf-literary";

  const lineHeight = profile.lineSpacing === 480 ? "2.0" : profile.lineSpacing === 360 ? "1.5" : "1.2";
  const alignment = profile.paragraphAlignment === "both" ? "justify" : "left";

  const parts: string[] = [];

  // Wrapper with page styling
  parts.push(`
    <div class="apa-document" style="font-family: '${font}', Georgia, serif; font-size: ${profile.fontSizePt}pt; line-height: ${lineHeight}; color: #111827; text-align: ${alignment};">
  `);

  // Running Header preview
  parts.push(`
    <div class="apa-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 24px; font-size: 10pt; color: #6b7280;">
      <div>${isProfessional ? escapeHtml((structure.title || "").slice(0, 50).toUpperCase()) : (isAdf ? "Academic Development Forum Book Chapter" : "")}</div>
      <div style="font-weight: 600;">Page 1</div>
    </div>
  `);

  // Title Page
  if (isStudent) {
    parts.push(`
      <div class="apa-title-page" style="text-align: center; margin-bottom: 48px; padding-top: 36px; border-bottom: 2px dashed #e5e7eb; padding-bottom: 36px;">
        <h1 style="font-size: ${profile.fontSizePt}pt; font-weight: bold; margin-bottom: 24px; line-height: ${lineHeight};">
          ${escapeHtml(toApaTitleCase(structure.title))}
        </h1>
        <div style="margin-bottom: 12px; font-size: ${profile.fontSizePt}pt;">
          ${escapeHtml(structure.authors.join(", ") || "Author Name")}
        </div>
        <div style="margin-bottom: 12px; font-size: ${profile.fontSizePt}pt;">
          ${escapeHtml(structure.affiliations.join(", ") || "Department and Institution Affiliation")}
        </div>
        ${structure.courseInfo ? `<div style="margin-bottom: 6px;">${escapeHtml(structure.courseInfo)}</div>` : ""}
        ${structure.instructorName ? `<div style="margin-bottom: 6px;">${escapeHtml(structure.instructorName)}</div>` : ""}
        ${structure.dueDate ? `<div style="margin-bottom: 6px;">${escapeHtml(structure.dueDate)}</div>` : ""}
      </div>
    `);
  } else if (isAdf) {
    // ADF Title Layout
    parts.push(`
      <div class="adf-title-section" style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 16pt; font-weight: bold; margin-bottom: 12px; line-height: 1.3;">
          ${escapeHtml(toApaTitleCase(structure.title))}
        </h1>
        <div style="font-size: 10pt; font-weight: bold; margin-bottom: 16px; color: #374151;">
          ${structure.parsedAuthors && structure.parsedAuthors.length > 0
            ? structure.parsedAuthors.map((a, i) => `${escapeHtml(a.name)}<sup>${a.num || i + 1}${a.star ? " *" : ""}</sup>`).join(", ")
            : escapeHtml(structure.authors.join(", "))}
        </div>
      </div>
    `);
  } else if (isProfessional) {
    parts.push(`
      <div class="apa-title-page-pro" style="text-align: center; margin-bottom: 48px; padding-top: 24px; border-bottom: 2px dashed #e5e7eb; padding-bottom: 36px;">
        <h1 style="font-size: ${profile.fontSizePt}pt; font-weight: bold; margin-bottom: 24px;">
          ${escapeHtml(toApaTitleCase(structure.title))}
        </h1>
        <div style="margin-bottom: 12px;">${escapeHtml(structure.authors.join(", "))}</div>
        <div style="margin-bottom: 24px;">${escapeHtml(structure.affiliations.join(", "))}</div>
      </div>
    `);
  } else if (isLiterary) {
    parts.push(`
      <div class="adf-literary-title" style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 18pt; font-weight: bold; margin-bottom: 8px;">${escapeHtml(structure.title)}</h1>
        <div style="font-size: 12pt; font-style: italic; color: #4b5563;">by ${escapeHtml(structure.authors.join(", "))}</div>
      </div>
    `);
  }

  // Abstract section
  if (structure.abstract) {
    parts.push(`
      <div class="apa-abstract-section" style="margin-bottom: 24px;">
        <h2 style="font-size: ${profile.fontSizePt}pt; font-weight: bold; text-align: center; margin-bottom: 12px;">Abstract</h2>
        <p style="text-indent: 0; margin-bottom: 12px; line-height: ${lineHeight}; text-align: ${alignment};">
          ${escapeHtml(structure.abstract)}
        </p>
        ${structure.keywords && structure.keywords.length > 0 ? `
          <p style="text-indent: 0.5in; margin-bottom: 24px; line-height: ${lineHeight};">
            <span style="font-style: italic;">Keywords:</span> ${escapeHtml(structure.keywords.join("; "))}
          </p>
        ` : ""}
      </div>
    `);
  }

  // Page 2 Title repeat (for APA Student & Professional)
  if (isStudent || isProfessional) {
    parts.push(`
      <h2 style="font-size: ${profile.fontSizePt}pt; font-weight: bold; text-align: center; margin-bottom: 24px; margin-top: 24px;">
        ${escapeHtml(toApaTitleCase(structure.title))}
      </h2>
    `);
  }

  // Body paragraphs
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

    // Table
    if (/^Table\s+\d+/i.test(pText)) {
      const tbl = structure.tables?.[tableIndex] || {
        number: tableIndex + 1,
        title: "Table Data",
        notes: undefined,
      };

      parts.push(`
        <div class="apa-table-wrapper" style="margin: 24px 0;">
          <div style="font-weight: bold; margin-bottom: 4px;">Table ${tbl.number}</div>
          <div style="font-style: italic; margin-bottom: 8px;">${escapeHtml(toApaTitleCase(tbl.title))}</div>
          ${htmlTables[tableIndex] ? buildHtmlTablePreview(htmlTables[tableIndex]) : ""}
          ${tbl.notes ? `<div style="font-size: 10pt; margin-top: 6px;"><span style="font-style: italic;">Note.</span> ${escapeHtml(tbl.notes)}</div>` : ""}
        </div>
      `);
      tableIndex++;
      continue;
    }

    // Figure
    if (/^(?:Figure|Fig\.)\s+\d+/i.test(pText)) {
      const fig = structure.figures?.[figureIndex] || {
        number: figureIndex + 1,
        title: "Figure Graphic",
        notes: undefined,
      };

      parts.push(`
        <div class="apa-figure-wrapper" style="margin: 24px 0;">
          <div style="font-weight: bold; margin-bottom: 4px;">Figure ${fig.number}</div>
          <div style="font-style: italic; margin-bottom: 8px;">${escapeHtml(toApaTitleCase(fig.title))}</div>
          <div style="background-color: #f9fafb; border: 1px dashed #d1d5db; padding: 24px; text-align: center; color: #6b7280; font-style: italic; margin: 8px 0; border-radius: 6px;">
            [Embedded Graphic / Chart Content: Figure ${fig.number}]
          </div>
          ${fig.notes ? `<div style="font-size: 10pt; margin-top: 6px;"><span style="font-style: italic;">Note.</span> ${escapeHtml(fig.notes)}</div>` : ""}
        </div>
      `);
      figureIndex++;
      continue;
    }

    // Matched Heading
    const matchedHeading = structure.headings.find((h) => h.originalText === pText || h.text === toApaTitleCase(pText));
    if (matchedHeading) {
      parts.push(buildHtmlHeadingPreview(matchedHeading, profile.fontSizePt));
      continue;
    }

    // Standard body paragraph
    parts.push(`
      <p style="text-indent: 0.5in; margin-bottom: 0; line-height: ${lineHeight}; text-align: ${alignment};">
        ${escapeHtml(pText)}
      </p>
    `);
  }

  // References section
  if (structure.references && structure.references.length > 0) {
    parts.push(`
      <div class="apa-references-section" style="margin-top: 36px; padding-top: 24px; border-top: 2px dashed #e5e7eb;">
        <h2 style="font-size: ${profile.fontSizePt}pt; font-weight: bold; text-align: center; margin-bottom: 24px;">References</h2>
        ${structure.references.map((ref) => {
          // Format DOI as clickable link in preview
          const linkedRef = escapeHtml(ref).replace(
            /(https?:\/\/doi\.org\/[^\s]+)/gi,
            '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">$1</a>'
          );
          return `
            <p style="padding-left: 0.5in; text-indent: -0.5in; margin-bottom: 12px; line-height: ${lineHeight}; text-align: left;">
              ${linkedRef}
            </p>
          `;
        }).join("")}
      </div>
    `);
  }

  // First page footer affiliations if ADF
  if (isAdf && structure.affiliations.length > 0) {
    parts.push(`
      <div class="adf-footer-preview" style="margin-top: 48px; padding-top: 12px; border-top: 1px solid #9ca3af; font-size: 8pt; color: #4b5563; line-height: 1.4;">
        ${structure.parsedAffiliations && structure.parsedAffiliations.length > 0
          ? structure.parsedAffiliations.map((a) => `<sup>${escapeHtml(a.num)}</sup> ${escapeHtml(a.text)}`).join(" | ")
          : escapeHtml(structure.affiliations.join(" | "))}
        ${structure.correspondingEmail ? ` | <strong>* Correspondence:</strong> ${escapeHtml(structure.correspondingEmail)}` : ""}
      </div>
    `);
  }

  parts.push("</div>");
  return parts.join("\n");
}

function buildHtmlHeadingPreview(h: HeadingInfo, fontPt: number): string {
  const text = escapeHtml(h.text);
  const runInText = h.runInText ? escapeHtml(h.runInText) : "";

  switch (h.level) {
    case 1:
      return `<h2 style="font-size: ${fontPt}pt; font-weight: bold; text-align: center; margin-top: 24px; margin-bottom: 12px;">${text}</h2>`;
    case 2:
      return `<h3 style="font-size: ${fontPt}pt; font-weight: bold; text-align: left; margin-top: 20px; margin-bottom: 8px;">${text}</h3>`;
    case 3:
      return `<h4 style="font-size: ${fontPt}pt; font-weight: bold; font-style: italic; text-align: left; margin-top: 16px; margin-bottom: 8px;">${text}</h4>`;
    case 4:
      return `
        <p style="text-indent: 0.5in; margin-top: 12px; margin-bottom: 0;">
          <span style="font-weight: bold;">${text}${text.endsWith(".") ? "" : "."}</span> ${runInText}
        </p>
      `;
    case 5:
      return `
        <p style="text-indent: 0.5in; margin-top: 12px; margin-bottom: 0;">
          <span style="font-weight: bold; font-style: italic;">${text}${text.endsWith(".") ? "" : "."}</span> ${runInText}
        </p>
      `;
  }
}

function buildHtmlTablePreview(rows: string[][]): string {
  if (!rows || rows.length === 0) return "";
  const headerRow = rows[0];
  const bodyRows = rows.slice(1);

  return `
    <table style="width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 10pt;">
      <thead>
        <tr style="border-top: 1.5px solid #111827; border-bottom: 1px solid #111827;">
          ${headerRow.map((cell, idx) => `<th style="padding: 6px 8px; text-align: ${idx === 0 ? "left" : "center"}; font-weight: bold;">${escapeHtml(cell)}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${bodyRows.map((row, rIdx) => {
          const isLast = rIdx === bodyRows.length - 1;
          return `
            <tr style="${isLast ? "border-bottom: 1.5px solid #111827;" : ""}">
              ${row.map((cell, idx) => `<td style="padding: 6px 8px; text-align: ${idx === 0 ? "left" : "center"};">${escapeHtml(cell)}</td>`).join("")}
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

