const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'extracted_template', 'word');
const docXml = fs.readFileSync(path.join(dir, 'document.xml'), 'utf8');

// Function to clean text
function extractCleanText(pXml) {
  // Extract all <w:t> content
  return [...pXml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map(m => m[1]).join('');
}

// Parse paragraphs
const pRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
let match;
let count = 0;

console.log('=== EXACT DOCUMENT CONTENT & ORDER ===\n');

while ((match = pRegex.exec(docXml)) !== null) {
  const pXml = match[1];
  const text = extractCleanText(pXml);
  
  const alignMatch = pXml.match(/<w:jc w:val="([^"]+)"/);
  const align = alignMatch ? alignMatch[1] : 'both/justified';

  const spacingMatch = pXml.match(/<w:spacing\b([^>]*)\/>/);
  const spacing = spacingMatch ? spacingMatch[1] : '';

  const szMatch = pXml.match(/<w:sz w:val="([^"]+)"/);
  const size = szMatch ? Number(szMatch[1]) / 2 + 'pt' : '12pt';

  const bMatch = pXml.match(/<w:b[\s\/>]/);
  const iMatch = pXml.match(/<w:i[\s\/>]/);
  const hasDrawing = pXml.includes('<w:drawing>');

  if (text.trim().length > 0 || hasDrawing) {
    console.log(`P#${count++} [${size}, ${align}, B:${!!bMatch}, I:${!!iMatch}, Spacing:${spacing}]`);
    console.log(`"${text.trim()}"`);
    if (hasDrawing) console.log('  -> [CONTAINS EMBEDDED DRAWING/IMAGE]');
    console.log('');
  }
}

// Inspect tables in docXml
const tbls = [...docXml.matchAll(/<w:tbl\b[\s\S]*?<\/w:tbl>/g)];
console.log(`=== TABLES FOUND: ${tbls.length} ===`);
tbls.forEach((t, i) => {
  const rows = [...t[0].matchAll(/<w:tr\b[\s\S]*?<\/w:tr>/g)];
  console.log(`Table #${i + 1}: ${rows.length} rows`);
  // Print first 2 rows text
  rows.slice(0, 3).forEach((r, ri) => {
    const cells = [...r[0].matchAll(/<w:tc\b[\s\S]*?<\/w:tc>/g)].map(c => extractCleanText(c[0]));
    console.log(`  Row ${ri}: [ ${cells.join(' | ')} ]`);
  });
});
