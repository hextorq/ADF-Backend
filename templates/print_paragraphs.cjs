const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'extracted_template', 'word');
const docXml = fs.readFileSync(path.join(dir, 'document.xml'), 'utf8');

function extractCleanText(pXml) {
  return [...pXml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map(m => m[1]).join('');
}

const pRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
let match;
let count = 0;

while ((match = pRegex.exec(docXml)) !== null) {
  const pXml = match[1];
  const text = extractCleanText(pXml).trim();
  
  const alignMatch = pXml.match(/<w:jc w:val="([^"]+)"/);
  const align = alignMatch ? alignMatch[1] : 'left/both';

  const spacingBefore = pXml.match(/<w:spacing[^>]*w:before="([^"]+)"/);
  const spacingAfter = pXml.match(/<w:spacing[^>]*w:after="([^"]+)"/);
  const lineSpacing = pXml.match(/<w:spacing[^>]*w:line="([^"]+)"/);

  const szMatch = pXml.match(/<w:sz w:val="([^"]+)"/);
  const size = szMatch ? Number(szMatch[1]) / 2 + 'pt' : '12pt';

  const bMatch = pXml.match(/<w:b[\s\/>]/);
  const iMatch = pXml.match(/<w:i[\s\/>]/);
  const hasDrawing = pXml.includes('<w:drawing>');

  if (text.length > 0 || hasDrawing) {
    const spStr = `b4:${spacingBefore ? spacingBefore[1] : '0'}, aft:${spacingAfter ? spacingAfter[1] : '0'}, ln:${lineSpacing ? lineSpacing[1] : 'auto'}`;
    console.log(`[P#${count++}] [${size}] [${align}] [${bMatch ? 'BOLD' : 'NORM'}] [${iMatch ? 'ITALIC' : 'NORM'}] [${spStr}]`);
    console.log(text || '[EMBEDDED DRAWING/IMAGE]');
    console.log('----------------------------------------------------');
  }
}
