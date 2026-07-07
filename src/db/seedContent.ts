import { pool } from "./pool.js";

const seedItems: Record<string, string> = {
  "nav.item.home.label": "Home",
  "nav.item.about.label": "About Us",
  "nav.item.journals.label": "Journals",
  "nav.item.chapter-publications.label": "Chapter Publications",
  "nav.item.literary-publications.label": "Literary Publications",
  "nav.item.academic-programmes.label": "Academic Programmes",
  "nav.item.guidelines.label": "Guidelines",
  "nav.item.guidelines.author.label": "Author Guidelines",
  "nav.item.guidelines.reviewer.label": "Reviewer Guidelines",
  "nav.item.guidelines.editor.label": "Editor Guidelines",
  "nav.item.editorial-board.label": "Editorial Board",
  "nav.item.policies.label": "Policies",
  "nav.item.contact.label": "Contact",

  "home.hero.slide.1.title": "Shape the Future of Research",
  "home.hero.slide.1.description":
    "Contribute your research to our bi-monthly edited volume series — Convergence: Multidisciplinary Perspectives in Contemporary Research.",
  "home.hero.slide.2.title": "Share Your Research with the World",
  "home.hero.slide.2.description":
    "Publish your original research in our peer-reviewed journal — discoverable, citable, and open to a global audience.",
  "home.hero.slide.3.title": "Your Story Deserves to Be Published",
  "home.hero.slide.3.description":
    "ADF publishes novels, novellas, poetry collections, short stories, and anthologies with full professional support.",
  "home.hero.slide.4.title": "Nurture Your Academic Mind",
  "home.hero.slide.4.description":
    "Join FDPs, workshops, and short-term courses on research methodology, academic writing, and publication ethics.",
  "home.hero.slide.5.title": "Attitude Defines Future",
  "home.hero.slide.5.description":
    "Academic Development Forum is a growing publication house committed to research, literature, and academic excellence.",
};

async function main() {
  for (const [key, value] of Object.entries(seedItems)) {
    await pool.query(
      `INSERT INTO content_items (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO NOTHING`,
      [key, value]
    );
  }
  console.log(`seeded ${Object.keys(seedItems).length} content items`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
