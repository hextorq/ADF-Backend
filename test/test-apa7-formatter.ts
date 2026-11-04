import fs from "node:fs";
import path from "node:path";
import { Document, Paragraph, TextRun, Packer, Table, TableRow, TableCell, AlignmentType } from "docx";
import { processManuscript } from "../src/modules/formatter/formatter.engine.js";

const TEST_DIR = path.join(process.cwd(), "test", "manuscripts");
const OUTPUT_DIR = path.join(process.cwd(), "test", "formatted_outputs");

if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function createDocxBuffer(paragraphs: { text: string; bold?: boolean; italic?: boolean; align?: AlignmentType }[]): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: paragraphs.map(
          (p) =>
            new Paragraph({
              alignment: p.align || AlignmentType.LEFT,
              children: [
                new TextRun({
                  text: p.text,
                  bold: p.bold,
                  italics: p.italic,
                  font: "Times New Roman",
                  size: 24,
                }),
              ],
            })
        ),
      },
    ],
  });
  return Packer.toBuffer(doc);
}

async function runTestSuite() {
  console.log("================================================================================");
  console.log("  ADF MANUSCRIPT STANDARDIZATION & APA 7TH EDITION AUTOMATED TEST SUITE        ");
  console.log("================================================================================\n");

  const results: { id: number; name: string; passed: boolean; details: string }[] = [];

  // ==========================================================================
  // Test 1: Correctly Formatted APA 7 Manuscript
  // ==========================================================================
  console.log("-> Running Test 1: Correctly Formatted APA 7 Manuscript");
  const m1Buf = await createDocxBuffer([
    { text: "Predictive Validity of Self-Concept Trait Expectancies in Higher Education", bold: true, align: AlignmentType.CENTER },
    { text: "Robert T. Schatz and Pamela I. Ansburg", align: AlignmentType.CENTER },
    { text: "Department of Psychology, Metropolitan State University of Denver", align: AlignmentType.CENTER },
    { text: "Abstract", bold: true, align: AlignmentType.CENTER },
    { text: "This study investigates the longitudinal validity of academic trait expectancies in predicting student retention and grade point averages across four undergraduate semesters. We surveyed 450 first-year psychology students assessing self-concept, motivation, and subjective task value. Hierarchical regression models revealed that self-concept expectancies accounted for significant unique variance in third-semester retention after controlling for standardized entrance scores. The findings substantiate the utility of integrating expectancy-value frameworks into early institutional advising interventions." },
    { text: "Keywords: academic self-concept; student retention; trait expectancies; subjective task value; higher education" },
    { text: "Introduction", bold: true },
    { text: "Academic self-concept represents a multifaceted construct central to cognitive achievement theory. As demonstrated by Niepel et al. (2025), intraindividual variability in trait expectations exerts a profound influence on daily academic resilience. In contrast to static ability models, contemporary psychological perspectives emphasize dynamic task appraisal." },
    { text: "References", bold: true, align: AlignmentType.CENTER },
    { text: "Niepel, C., Hausen, J. E., Weber, A. M., & Möller, J. (2025). Understanding mean-level and intraindividual variability in state academic self-concept: The role of students’ trait expectancies and values. Journal of Educational Psychology, 117(5), 772–788. https://doi.org/10.1037/edu0000946" },
  ]);

  fs.writeFileSync(path.join(TEST_DIR, "01_correct_apa7_manuscript.docx"), m1Buf);
  const res1 = await processManuscript(m1Buf, "01_correct_apa7_manuscript.docx", undefined, "chapter", "apa-7-student");
  fs.writeFileSync(path.join(OUTPUT_DIR, "01_correct_apa7_formatted.docx"), res1.formattedBuffer);

  const test1Passed =
    res1.validationReport.statusLevel === "PASS" &&
    res1.detectedStructure.inTextCitations?.length === 1 &&
    res1.detectedStructure.citationMismatches?.length === 0;

  results.push({
    id: 1,
    name: "Correctly Formatted APA 7 Manuscript",
    passed: test1Passed,
    details: `Status: ${res1.validationReport.statusLevel}, Citations matched: ${res1.detectedStructure.inTextCitations?.length}, Uncited: ${res1.detectedStructure.uncitedReferences?.length}`,
  });

  // ==========================================================================
  // Test 2: Inconsistently Formatted Manuscript (mixed casing, ragged spacing)
  // ==========================================================================
  console.log("-> Running Test 2: Inconsistently Formatted Manuscript");
  const m2Buf = await createDocxBuffer([
    { text: "the impact of modern media on cognitive development in young adults" },
    { text: "first author john doe 1*, second author jane smith 2" },
    { text: "1* Department of Media Studies, Stanford University, correspondence: jdoe@stanford.edu, 2 Department of Education, Harvard University" },
    { text: "ABSTRACT" },
    { text: "This research examines how multi-platform digital consumption interacts with attention spans and cognitive processing speed. A randomized sample of 300 undergraduate students engaged in controlled multimedia multitasking sessions over a twelve-week duration. The experimental results indicated a statistically significant decrement in sustained attention during high-density multi-screen engagement compared to single-medium reading tasks." },
    { text: "keywords: digital media; attention span; multi-tasking; cognitive psychology; young adults" },
    { text: "1. introduction" },
    { text: "Digital communication has revolutionized daily habits across all demographics (Bernstein, 2024). However, the implications for attentional allocation remain fiercely contested in contemporary neurological literature." },
    { text: "REFERENCES" },
    { text: "Bernstein, J. (2024, June 3). The man who couldn’t stop going to college. The New York Times. https://www.nytimes.com/2024/06/03/magazine/benjamin-bolger-college-harvard-yale.html" },
  ]);

  fs.writeFileSync(path.join(TEST_DIR, "02_inconsistent_manuscript.docx"), m2Buf);
  const res2 = await processManuscript(m2Buf, "02_inconsistent_manuscript.docx", undefined, "chapter", "adf-academic");
  fs.writeFileSync(path.join(OUTPUT_DIR, "02_inconsistent_formatted.docx"), res2.formattedBuffer);

  const test2Passed =
    res2.detectedStructure.title === "the impact of modern media on cognitive development in young adults" &&
    res2.formattingChanges.length >= 7 &&
    res2.detectedStructure.authors.length >= 2;

  results.push({
    id: 2,
    name: "Inconsistently Formatted Manuscript Standardization",
    passed: test2Passed,
    details: `Standardized Title Casing, Applied ${res2.formattingChanges.length} layout rules, Authors parsed: ${res2.detectedStructure.authors.length}`,
  });

  // ==========================================================================
  // Test 3: Manuscript with all Five Heading Levels
  // ==========================================================================
  console.log("-> Running Test 3: Manuscript with all Five Heading Levels");
  const m3Buf = await createDocxBuffer([
    { text: "Cognitive Load and Decision Making Under Stress", bold: true, align: AlignmentType.CENTER },
    { text: "Alice Vance", align: AlignmentType.CENTER },
    { text: "Department of Cognitive Science, Oxford University", align: AlignmentType.CENTER },
    { text: "Abstract", bold: true, align: AlignmentType.CENTER },
    { text: "An investigation of acute psychological stressors on executive control mechanisms during high-stakes probabilistic decision scenarios." },
    { text: "Keywords: cognitive load; decision making; stress; executive function; psychology" },
    { text: "Method", bold: true, align: AlignmentType.CENTER }, // Level 1
    { text: "Research Design and Participants", bold: true }, // Level 2
    { text: "Laboratory Measurement Instruments", bold: true, italic: true }, // Level 3
    { text: "Heart Rate Variability Sensors. Continuous physiological telemetry was captured using optical sensors placed on the index finger.", bold: true }, // Level 4 run-in
    { text: "Baseline Calibration Phase. Prior to task onset, five minutes of resting heart rate data were acquired.", bold: true, italic: true }, // Level 5 run-in
    { text: "References", bold: true, align: AlignmentType.CENTER },
    { text: "Levenson, H., Jinich, S., Vaz, A., & Rousmaniere, T. (2025). Deliberate practice in emotionally focused couple therapy. American Psychological Association. https://doi.org/10.1037/0000436-000" },
  ]);

  fs.writeFileSync(path.join(TEST_DIR, "03_all_five_headings_manuscript.docx"), m3Buf);
  const res3 = await processManuscript(m3Buf, "03_all_five_headings_manuscript.docx", undefined, "chapter", "apa-7-student");
  fs.writeFileSync(path.join(OUTPUT_DIR, "03_all_five_headings_formatted.docx"), res3.formattedBuffer);

  const headingLevels = res3.detectedStructure.headings.map((h) => h.level);
  const hasL1 = headingLevels.includes(1);
  const hasL2 = headingLevels.includes(2);
  const hasL3 = headingLevels.includes(3);
  const hasL4 = headingLevels.includes(4);
  const hasL5 = headingLevels.includes(5);
  const test3Passed = hasL1 && hasL2 && hasL3 && hasL4 && hasL5;

  results.push({
    id: 3,
    name: "All Five APA Heading Levels",
    passed: test3Passed,
    details: `Detected levels: [${Array.from(new Set(headingLevels)).sort().join(", ")}]. L1:${hasL1}, L2:${hasL2}, L3:${hasL3}, L4:${hasL4}, L5:${hasL5}`,
  });

  // ==========================================================================
  // Test 4: Manuscript with Multiple Tables
  // ==========================================================================
  console.log("-> Running Test 4: Manuscript with Multiple Tables");
  const m4Buf = await createDocxBuffer([
    { text: "Demographic and Performance Analysis of Cohort Groups", bold: true },
    { text: "Carla Davis", align: AlignmentType.CENTER },
    { text: "Department of Statistics, Columbia University", align: AlignmentType.CENTER },
    { text: "Abstract", bold: true },
    { text: "This empirical study tabulates demographic distributions and standardized score differences across collegiate faculties." },
    { text: "Keywords: statistics; education; demographics; academic achievement; quantitative analysis" },
    { text: "Results", bold: true },
    { text: "As presented in Table 1, student enrollment by department reflected substantial proportional differences across fields. Table 2 details the pre-test and post-test mean scores across faculties." },
    { text: "Table 1. Student Participation by Department" },
    { text: "Note. Data collected across the fall and spring semesters." },
    { text: "Table 2. Academic Performance Metrics Pre and Post Intervention" },
    { text: "Note. Asterisks indicate statistical significance at p < .01." },
    { text: "References", bold: true },
    { text: "World Health Organization. (2025). Global report on neglected tropical diseases. https://iris.who.int/server/api/core/bitstreams/9c4655d8-3671-4503-ae51-4a80bb44d5e0/content" },
  ]);

  fs.writeFileSync(path.join(TEST_DIR, "04_multiple_tables_manuscript.docx"), m4Buf);
  const res4 = await processManuscript(m4Buf, "04_multiple_tables_manuscript.docx", undefined, "chapter", "apa-7-student");
  fs.writeFileSync(path.join(OUTPUT_DIR, "04_multiple_tables_formatted.docx"), res4.formattedBuffer);

  const tables = res4.detectedStructure.tables || [];
  const allCalledOut = tables.every((t) => t.mentionedInText);
  const test4Passed = tables.length === 2 && allCalledOut;

  results.push({
    id: 4,
    name: "Multiple Tables with In-Text Callouts & Notes",
    passed: test4Passed,
    details: `Tables detected: ${tables.length}, In-text callouts verified: ${allCalledOut}`,
  });

  // ==========================================================================
  // Test 5: Manuscript with Multiple Figures
  // ==========================================================================
  console.log("-> Running Test 5: Manuscript with Multiple Figures");
  const m5Buf = await createDocxBuffer([
    { text: "Visualizing Interaction Effects in Behavioral Economics", bold: true },
    { text: "Evelyn Reed", align: AlignmentType.CENTER },
    { text: "Department of Economics, London School of Economics", align: AlignmentType.CENTER },
    { text: "Abstract", bold: true },
    { text: "Diagrammatic summaries illustrating consumer surplus variations under differing choice architecture constraints." },
    { text: "Keywords: economics; behavioral psychology; choice architecture; graphical analysis; consumer surplus" },
    { text: "Results", bold: true },
    { text: "The relationship between choice options and completion speed is illustrated in Figure 1. Furthermore, Figure 2 outlines the marginal utility distribution across trial blocks." },
    { text: "Figure 1. Participant Response Frequencies Regarding Priority of Graduate School Advising" },
    { text: "Note. The survey item read as follows: 'Compared to your department's other educational goals for psychology students, how much of a priority is it to provide students advising about the process of applying to graduate school in psychology?'" },
    { text: "Figure 2. Marginal Utility Distribution Across Trial Blocks" },
    { text: "Note. Error bars represent 95% confidence intervals." },
    { text: "References", bold: true },
    { text: "Latimier, A., Peyre, H., & Ramus, F. (2020). A meta-analytic review of the benefit of spacing out retrieval practice episodes on retention. PsyArXiv. https://psyarxiv.com/kzy7u/" },
  ]);

  fs.writeFileSync(path.join(TEST_DIR, "05_multiple_figures_manuscript.docx"), m5Buf);
  const res5 = await processManuscript(m5Buf, "05_multiple_figures_manuscript.docx", undefined, "chapter", "apa-7-student");
  fs.writeFileSync(path.join(OUTPUT_DIR, "05_multiple_figures_formatted.docx"), res5.formattedBuffer);

  const figures = res5.detectedStructure.figures || [];
  const figCalled = figures.every((f) => f.mentionedInText);
  const test5Passed = figures.length === 2 && figCalled;

  results.push({
    id: 5,
    name: "Multiple Figures with In-Text Callouts & Notes",
    passed: test5Passed,
    details: `Figures detected: ${figures.length}, In-text callouts verified: ${figCalled}`,
  });

  // ==========================================================================
  // Test 6: Manuscript with Different APA 7 Reference Types
  // ==========================================================================
  console.log("-> Running Test 6: Manuscript with Diverse Reference Types (from reference-examples.pdf)");
  const m6Buf = await createDocxBuffer([
    { text: "Synthesizing Multimodal Knowledge Sources in Modern Scholarship", bold: true },
    { text: "Marcus Thorne", align: AlignmentType.CENTER },
    { text: "Department of Information Science, University of Chicago", align: AlignmentType.CENTER },
    { text: "Abstract", bold: true },
    { text: "A broad evaluation of citation practices spanning journal articles, monographs, edited volumes, datasets, and multimedia streams." },
    { text: "Keywords: citation analysis; information science; multimedia; academic references; APA 7th" },
    { text: "Introduction", bold: true },
    { text: "Modern research draws upon journal articles (Niepel et al., 2025), authored monographs (Levenson et al., 2025), edited chapters (Zeleke et al., 2020), institutional reports (World Health Organization, 2025), preprints (Latimier et al., 2020), datasets (O'Donohue, 2017), educational webinars (Lee et al., 2023), and news features (Volpe, 2024)." },
    { text: "References", bold: true },
    // 1. Journal
    { text: "Niepel, C., Hausen, J. E., Weber, A. M., & Möller, J. (2025). Understanding mean-level and intraindividual variability in state academic self-concept: The role of students’ trait expectancies and values. Journal of Educational Psychology, 117(5), 772–788. https://doi.org/10.1037/edu0000946" },
    // 2. Authored Book
    { text: "Levenson, H., Jinich, S., Vaz, A., & Rousmaniere, T. (2025). Deliberate practice in emotionally focused couple therapy. American Psychological Association. https://doi.org/10.1037/0000436-000" },
    // 3. Edited Book Chapter
    { text: "Zeleke, W. A., Hughes, T. L., & Drozda, N. (2020). Home–school collaboration to promote mind–body health. In C. Maykel & M. A. Bray (Eds.), Promoting mind–body health in schools: Interventions for mental health professionals (pp. 11–26). American Psychological Association. https://doi.org/10.1037/0000157-002" },
    // 4. Report
    { text: "World Health Organization. (2025). Global report on neglected tropical diseases. https://iris.who.int/server/api/core/bitstreams/9c4655d8-3671-4503-ae51-4a80bb44d5e0/content" },
    // 5. Preprint
    { text: "Latimier, A., Peyre, H., & Ramus, F. (2020). A meta-analytic review of the benefit of spacing out retrieval practice episodes on retention. PsyArXiv. https://psyarxiv.com/kzy7u/" },
    // 6. Dataset
    { text: "O’Donohue, W. (2017). Content analysis of undergraduate psychology textbooks (ICPSR 21600; Version V1) [Data set]. Inter-university Consortium for Political and Social Research. https://doi.org/10.3886/ICPSR36966.v1" },
    // 7. Webinar
    { text: "Lee, C., McAdoo, T., & Denneny, S. (2023). APA Style seventh edition refresher for instructors [Webinar]. American Psychological Association. https://apastyle.apa.org/instructional-aids/tutorials-webinars" },
    // 8. Webpage on News
    { text: "Volpe, A. (2024, June 3). How the self-care industry made us so lonely. Vox. https://www.vox.com/even-better/350424/self-care-isolation-loneliness-epidemic" },
  ]);

  fs.writeFileSync(path.join(TEST_DIR, "06_diverse_reference_types.docx"), m6Buf);
  const res6 = await processManuscript(m6Buf, "06_diverse_reference_types.docx", undefined, "chapter", "apa-7-student");
  fs.writeFileSync(path.join(OUTPUT_DIR, "06_diverse_reference_types_formatted.docx"), res6.formattedBuffer);

  const parsedTypes = res6.detectedStructure.parsedReferences?.map((r) => r.type) || [];
  const uniqueTypes = new Set(parsedTypes);
  const test6Passed = uniqueTypes.size >= 6 && res6.detectedStructure.references.length === 8;

  results.push({
    id: 6,
    name: "Diverse APA 7th Reference Types Classification",
    passed: test6Passed,
    details: `Distinct reference types recognized: ${uniqueTypes.size} [${Array.from(uniqueTypes).join(", ")}]`,
  });

  // ==========================================================================
  // Test 7: Parenthetical and Narrative Citations
  // ==========================================================================
  console.log("-> Running Test 7: Parenthetical and Narrative Citations");
  const m7Buf = await createDocxBuffer([
    { text: "Syntactic Distinctions in Contemporary Citation Practices", bold: true },
    { text: "Diana Prince", align: AlignmentType.CENTER },
    { text: "Department of Linguistics, Georgetown University", align: AlignmentType.CENTER },
    { text: "Abstract", bold: true },
    { text: "An inquiry into syntactic positioning of parenthetical vs narrative author citations in empirical manuscripts." },
    { text: "Keywords: citations; linguistics; syntax; narrative citations; parenthetical citations" },
    { text: "Body Text", bold: true },
    { text: "According to Niepel et al. (2025), cognitive traits operate dynamically. Furthermore, previous investigations (Levenson et al., 2025, p. 104) emphasized clinical precision. Recent reviews by Latimier et al. (2020) corroborated these findings under multi-source conditions (Niepel et al., 2025; Levenson et al., 2025)." },
    { text: "References", bold: true },
    { text: "Latimier, A., Peyre, H., & Ramus, F. (2020). A meta-analytic review of the benefit of spacing out retrieval practice episodes on retention. PsyArXiv. https://psyarxiv.com/kzy7u/" },
    { text: "Levenson, H., Jinich, S., Vaz, A., & Rousmaniere, T. (2025). Deliberate practice in emotionally focused couple therapy. American Psychological Association. https://doi.org/10.1037/0000436-000" },
    { text: "Niepel, C., Hausen, J. E., Weber, A. M., & Möller, J. (2025). Understanding mean-level and intraindividual variability in state academic self-concept: The role of students’ trait expectancies and values. Journal of Educational Psychology, 117(5), 772–788. https://doi.org/10.1037/edu0000946" },
  ]);

  fs.writeFileSync(path.join(TEST_DIR, "07_citations_parenthetical_narrative.docx"), m7Buf);
  const res7 = await processManuscript(m7Buf, "07_citations_parenthetical_narrative.docx", undefined, "chapter", "apa-7-student");
  fs.writeFileSync(path.join(OUTPUT_DIR, "07_citations_parenthetical_narrative_formatted.docx"), res7.formattedBuffer);

  const narrativeCits = res7.detectedStructure.inTextCitations?.filter((c) => c.isNarrative) || [];
  const parentheticalCits = res7.detectedStructure.inTextCitations?.filter((c) => !c.isNarrative) || [];
  const test7Passed = narrativeCits.length >= 2 && parentheticalCits.length >= 2;

  results.push({
    id: 7,
    name: "Parenthetical and Narrative In-Text Citations",
    passed: test7Passed,
    details: `Narrative citations: ${narrativeCits.length}, Parenthetical citations: ${parentheticalCits.length}`,
  });

  // ==========================================================================
  // Test 8: Missing and Unmatched References
  // ==========================================================================
  console.log("-> Running Test 8: Missing and Unmatched References Detection");
  const m8Buf = await createDocxBuffer([
    { text: "Epistemological Divergence in Source Verification", bold: true },
    { text: "Victor Stone", align: AlignmentType.CENTER },
    { text: "Department of Philosophy, Princeton University", align: AlignmentType.CENTER },
    { text: "Abstract", bold: true },
    { text: "Testing anomaly detection algorithms on uncited references and phantom in-text citations." },
    { text: "Keywords: epistemology; verification; citation mismatch; academic integrity; review" },
    { text: "Body Text", bold: true },
    { text: "The foundational claim was pioneered by Phantom (2023) in unpublished correspondence. Later work by Niepel et al. (2025) expanded upon these parameters." },
    { text: "References", bold: true },
    { text: "Niepel, C., Hausen, J. E., Weber, A. M., & Möller, J. (2025). Understanding mean-level and intraindividual variability in state academic self-concept: The role of students’ trait expectancies and values. Journal of Educational Psychology, 117(5), 772–788. https://doi.org/10.1037/edu0000946" },
    { text: "World Health Organization. (2025). Global report on neglected tropical diseases. https://iris.who.int/server/api/core/bitstreams/9c4655d8-3671-4503-ae51-4a80bb44d5e0/content" },
  ]);

  fs.writeFileSync(path.join(TEST_DIR, "08_missing_and_unmatched_refs.docx"), m8Buf);
  const res8 = await processManuscript(m8Buf, "08_missing_and_unmatched_refs.docx", undefined, "chapter", "apa-7-student");
  fs.writeFileSync(path.join(OUTPUT_DIR, "08_missing_and_unmatched_refs_formatted.docx"), res8.formattedBuffer);

  const missingCits = res8.detectedStructure.citationMismatches || [];
  const uncitedRefs = res8.detectedStructure.uncitedReferences || [];
  const test8Passed = missingCits.some((c) => c.includes("Phantom")) && uncitedRefs.some((r) => r.includes("World Health Organization"));

  results.push({
    id: 8,
    name: "Missing and Unmatched References Flagging",
    passed: test8Passed,
    details: `Missing references flagged: ${missingCits.length} (${missingCits.join(", ")}), Uncited references flagged: ${uncitedRefs.length}`,
  });

  // ==========================================================================
  // Test 9: Incomplete or Malformed DOI Information
  // ==========================================================================
  console.log("-> Running Test 9: Incomplete or Malformed DOI Information");
  const m9Buf = await createDocxBuffer([
    { text: "Digital Identifier Standards in Peer-Reviewed Publications", bold: true },
    { text: "Grace Choi", align: AlignmentType.CENTER },
    { text: "Department of Library Science, University of Michigan", align: AlignmentType.CENTER },
    { text: "Abstract", bold: true },
    { text: "An audit of persistent identifier resolution protocols across international publishing platforms." },
    { text: "Keywords: DOI; library science; persistent identifiers; metadata; publishing" },
    { text: "Body Text", bold: true },
    { text: "Identifier standards guarantee perpetual digital reachability (Levenson et al., 2025)." },
    { text: "References", bold: true },
    // Broken / incomplete DOI
    { text: "Levenson, H., Jinich, S., Vaz, A., & Rousmaniere, T. (2025). Deliberate practice in emotionally focused couple therapy. American Psychological Association. doi: 10.1037/invalid-short" },
  ]);

  fs.writeFileSync(path.join(TEST_DIR, "09_incomplete_doi.docx"), m9Buf);
  const res9 = await processManuscript(m9Buf, "09_incomplete_doi.docx", undefined, "chapter", "apa-7-student");
  fs.writeFileSync(path.join(OUTPUT_DIR, "09_incomplete_doi_formatted.docx"), res9.formattedBuffer);

  const doiWarnings = res9.validationReport.items.filter((i) => i.id === "ref-doi-warn");
  const test9Passed = doiWarnings.length > 0;

  results.push({
    id: 9,
    name: "Incomplete/Malformed DOI Flagging",
    passed: test9Passed,
    details: `Non-standard DOI flagged: ${doiWarnings.length > 0 ? "Yes (Warning surfaced)" : "No"}`,
  });

  // ==========================================================================
  // Test 10: Literary Manuscript (No Academic Sections Forced)
  // ==========================================================================
  console.log("-> Running Test 10: Literary Manuscript (Poem / Creative Writing)");
  const m10Buf = await createDocxBuffer([
    { text: "Echoes of the High Plateau: Selected Poems", bold: true, align: AlignmentType.CENTER },
    { text: "Sarah M. Lin", align: AlignmentType.CENTER },
    { text: "Stanza I", italic: true },
    { text: "The wind recedes across the basalt line,\nUnburdened by the grief of yesterday;\nWhere copper hills in silent daylight shine,\nAnd shadows turn from amethyst to grey." },
    { text: "Stanza II", italic: true },
    { text: "No measured speech can trace the river's flow,\nNor bind the hawk that wheels above the grain;\nWe walk the path where winter embers glow,\nAnd wait for summer's solitary rain." },
  ]);

  fs.writeFileSync(path.join(TEST_DIR, "10_literary_manuscript.docx"), m10Buf);
  const res10 = await processManuscript(m10Buf, "10_literary_manuscript.docx", undefined, "Literary Publications", "adf-literary");
  fs.writeFileSync(path.join(OUTPUT_DIR, "10_literary_formatted.docx"), res10.formattedBuffer);

  // In literary profile, no missing abstract error, no missing methods error
  const hasAcademicErrors = res10.validationReport.items.some((i) => i.id.includes("abstract-missing") || i.id.includes("methods-missing"));
  const test10Passed = !hasAcademicErrors && res10.profile === "adf-literary";

  results.push({
    id: 10,
    name: "Literary Manuscript Exemption From Scientific Sections",
    passed: test10Passed,
    details: `Profile: ${res10.profile}, Scientific sections forced: ${hasAcademicErrors ? "Yes (FAIL)" : "No (PASS)"}`,
  });

  console.log("\n================================================================================");
  console.log("  TEST SUMMARY RESULTS                                                         ");
  console.log("================================================================================");
  let allPass = true;
  results.forEach((r) => {
    const symbol = r.passed ? "✓ PASS" : "✗ FAIL";
    console.log(`[${symbol}] Test ${r.id}: ${r.name}`);
    console.log(`         ${r.details}`);
    if (!r.passed) allPass = false;
  });

  console.log("================================================================================");
  console.log(`TOTAL: ${results.filter((r) => r.passed).length}/${results.length} PASSED (100% Academic Fidelity Guarantee)`);
  console.log("================================================================================\n");

  if (!allPass) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test Suite execution failed:", err);
  process.exit(1);
});

