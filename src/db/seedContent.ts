import { pool } from "./pool.js";

const seedItems: Record<string, string> = {};

function seed(key: string, value: string | number) {
  seedItems[key] = String(value);
}

function seedPage(key: string, eyebrow: string, title: string, description: string) {
  seed(`${key}.eyebrow`, eyebrow);
  seed(`${key}.title`, title);
  seed(`${key}.description`, description);
}

function seedGuidelines(
  key: string,
  data: {
    eyebrow: string;
    title: string;
    lead: string;
    sections: { h: string; t: string }[];
    action: { eyebrow: string; title: string; description: string };
  }
) {
  seedPage(key, data.eyebrow, data.title, data.lead);
  seed(`${key}.toc.title`, "On this page");
  data.sections.forEach((section, index) => {
    seed(`${key}.section.${index}.heading`, section.h);
    seed(`${key}.section.${index}.text`, section.t);
  });
  seed(`${key}.action.eyebrow`, data.action.eyebrow);
  seed(`${key}.action.title`, data.action.title);
  seed(`${key}.action.description`, data.action.description);
}

const navItems = [
  ["home", "Home"],
  ["about", "About Us"],
  ["journals", "Journals"],
  ["chapter-publications", "Chapter Publications"],
  ["literary-publications", "Literary Publications"],
  ["academic-programmes", "Academic Programmes"],
  ["guidelines", "Guidelines"],
  ["guidelines.author", "Author Guidelines"],
  ["guidelines.reviewer", "Reviewer Guidelines"],
  ["guidelines.editor", "Editor Guidelines"],
  ["editorial-board", "Editorial Board"],
  ["policies", "Policies"],
  ["contact", "Contact"],
];

for (const [key, label] of navItems) {
  seed(`nav.item.${key}.label`, label);
}

seed("site.logo.src", "/logo.png");
seed("breadcrumb.home", "Home");
[
  "About Us",
  "Academic Programmes",
  "Announcements",
  "Chapter Publications",
  "Contact",
  "Editorial Board",
  "Guidelines",
  "Author",
  "Editor",
  "Reviewer",
  "Journals",
  "Literary Publications",
  "Policies",
  "Search Results",
].forEach((label) => seed(`breadcrumb.${label}`, label));

seed("header.utility.tagline", "International Academic Publication House - ISSN - ISBN - DOI");
seed("header.utility.authors", "For Authors");
seed("header.utility.reviewers", "For Reviewers");
seed("header.utility.board", "Editorial Board");
seed("header.brand.name", "Academic Development Forum");
seed("header.brand.tagline", "Attitude Defines Future");
seed("header.search.button", "Search Publications");
[
  ["all", "All Publications"],
  ["journals", "Journals"],
  ["chapters", "Chapters"],
  ["books", "Books"],
  ["announcements", "Announcements"],
].forEach(([key, label]) => seed(`header.search.scope.${key}`, label));

seed("footer.brand.name", "Academic Development Forum");
seed("footer.brand.tagline", "Attitude Defines Future");
seed(
  "footer.brand.description",
  "An international publication house for peer-reviewed journals, edited volumes, literary works, and academic development programmes - committed to open access and global research dissemination."
);
seed("footer.newsletter.title", "Keep Up To Date");
seed("footer.newsletter.description", "Get journal CFPs, programme alerts, and open-access updates.");
seed("footer.bottom.policies", "Policies & Ethics");
seed("footer.bottom.openAccess", "Open Access");

const footerColumns = [
  { title: "Information for", links: ["Authors", "Reviewers", "Editors", "Readers", "Institutions"] },
  { title: "Open Access", links: ["Open Access Policy", "CC BY Licensing", "Article Processing", "Self-Archiving"] },
  { title: "Opportunities", links: ["Call for Papers", "Call for Chapters", "Editorial Roles", "Reviewer Panel", "Programmes"] },
  { title: "Help & Information", links: ["About ADF", "Editorial Board", "Announcements", "Contact Us", "Submission Guidelines"] },
];

for (const column of footerColumns) {
  seed(`footer.column.${column.title}.title`, column.title);
  column.links.forEach((link) => seed(`footer.link.${column.title}.${link}`, link));
}

seedPage(
  "page.about",
  "About ADF",
  "A new academic publishing house - built on integrity and access",
  "Academic Development Forum brings together peer-reviewed research, literary works, and academic development under one open, author-first home."
);
seedPage(
  "page.academic-programmes",
  "Academic Programmes",
  "Nurture your academic mind",
  "FDPs, workshops, training, and webinars on research methodology, academic writing, and publication ethics."
);
seedPage(
  "page.announcements",
  "Announcements",
  "Latest from the Academic Development Forum",
  "Calls for papers, calls for chapters, programme schedules, and editorial openings."
);
seedPage(
  "page.chapter-publications",
  "Convergence Series",
  "Chapter Publications - Multidisciplinary Perspectives in Contemporary Research",
  "A bi-monthly edited volume series. ISBN assigned, double-blind peer review, open access."
);
seedPage(
  "page.contact",
  "Contact",
  "We'd love to hear from you",
  "Editorial enquiries, submissions support, partnership proposals, or programme registration - write to us."
);
seedPage(
  "page.editorial-board",
  "Editorial Board",
  "A global editorial leadership",
  "Scholars shaping the editorial direction of ADF journals and volumes."
);
seedPage(
  "page.journals",
  "Journals",
  "Peer-reviewed, open-access journals",
  "Discoverable, citable, and globally accessible. Authors retain copyright."
);
seedPage(
  "page.literary-publications",
  "Literary Publications",
  "Your story deserves to be published",
  "Professional editing, cover design, ISBN assignment, and print + digital distribution for novelists, poets, and storytellers."
);
seedPage(
  "page.policies",
  "Policies",
  "Publication Ethics & Policies",
  "Our commitment to maintaining the highest standards of integrity, transparency, and ethical publishing."
);
seedPage("page.search", "Search", "Search", "Browse all publications, journals, and announcements.");

const heroSlides = [
  {
    key: "1",
    eyebrow: "Call for Chapters",
    title: "Shape the Future of Research",
    description:
      "Contribute your research to our bi-monthly edited volume series - Convergence: Multidisciplinary Perspectives in Contemporary Research.",
    highlight: "Convergence - Multidisciplinary Perspectives in Contemporary Research",
    features: ["ISBN Assigned", "Double-Blind Peer Review", "Open Access"],
    cta: "Submit Your Chapter",
  },
  {
    key: "2",
    eyebrow: "Peer-Reviewed Journal",
    title: "Share Your Research with the World",
    description:
      "Publish your original research in our peer-reviewed journal - discoverable, citable, and open to a global audience.",
    features: ["Online ISSN", "Open Access", "CC BY License"],
    cta: "Submit Your Paper",
  },
  {
    key: "3",
    eyebrow: "Literary Publishing",
    title: "Your Story Deserves to Be Published",
    description:
      "ADF publishes novels, novellas, poetry collections, short stories, and anthologies with full professional support.",
    features: ["Professional Editing", "Cover Design", "ISBN Assignment", "Print & Digital"],
    cta: "Publish Your Book",
  },
  {
    key: "4",
    eyebrow: "Academic Programmes",
    title: "Nurture Your Academic Mind",
    description:
      "Join FDPs, workshops, and short-term courses on research methodology, academic writing, and publication ethics.",
    features: ["Research Methodology", "Academic Writing", "Publication Ethics"],
    cta: "Explore Programmes",
  },
  {
    key: "5",
    eyebrow: "About ADF",
    title: "Attitude Defines Future",
    description:
      "Academic Development Forum is a growing publication house committed to research, literature, and academic excellence.",
    features: ["International Reach", "Open Access First", "Author-Centric"],
    cta: "Know More About ADF",
  },
];

for (const slide of heroSlides) {
  seed(`home.hero.slide.${slide.key}.eyebrow`, slide.eyebrow);
  seed(`home.hero.slide.${slide.key}.title`, slide.title);
  seed(`home.hero.slide.${slide.key}.description`, slide.description);
  if (slide.highlight) seed(`home.hero.slide.${slide.key}.highlight`, slide.highlight);
  slide.features.forEach((feature) => seed(`home.hero.slide.${slide.key}.feature.${feature}`, feature));
  seed(`home.hero.slide.${slide.key}.cta`, slide.cta);
}

[
  ["ISSN", "Online"],
  ["ISBN", "Assigned"],
  ["Peer Review", "Double-Blind"],
  ["Access", "Open - CC BY"],
].forEach(([label, value]) => {
  seed(`home.hero.fact.${label}.label`, label);
  seed(`home.hero.fact.${label}.value`, value);
});

seed("home.hub.eyebrow", "Dynamic Content Hub");
seed("home.hub.title", "Interactive Announcement Hub");
seed("home.hub.description", "Real-time updates on calls for papers, recent publications, and editorial activities.");
seed("home.hub.viewAll", "View all updates");
[
  "Announcements",
  "Recent Publications",
  "Latest Chapters",
  "Journal Releases",
  "Recent Activity",
  "Programmes & Events",
].forEach((tab) => seed(`home.hub.tab.${tab}`, tab));
seed("home.hub.empty.announcements", "No active announcements.");
seed("home.hub.empty.publications", "No recent publications.");
seed("home.hub.empty.chapters", "No latest chapters.");
seed("home.hub.empty.activities", "No recent activities.");
seed("home.hub.placeholder.note", "Manageable via Admin Panel");
seed("home.hub.pinned", "Pinned");
seed("home.hub.readMore", "Read more");
seed("home.hub.by", "By");
seed("home.hub.viewDetails", "View details");

const announcements = [
  ["1", "12 Jun 2026", "Editorial", "ADF expands editorial board with 14 new international members", "Welcoming scholars from 9 countries across humanities, sciences, and management."],
  ["2", "08 Jun 2026", "Publishing", "Convergence Volume III now in production", "Edited volume featuring 22 chapters across multidisciplinary research themes."],
  ["3", "01 Jun 2026", "Open Access", "All ADF journals adopt CC BY 4.0 by default", "Authors retain copyright; readers gain unrestricted access worldwide."],
  ["4", "Open - Rolling", "Journal", "International Journal of English for Academic Excellence - Vol. 2", "Original research articles, literature reviews, and pedagogical studies invited."],
  ["5", "Closes 30 Aug 2026", "Special Issue", "Special Issue: AI and the Future of Academic Writing", "Empirical and theoretical contributions on AI in research practice."],
];
for (const [id, date, category, title, excerpt] of announcements) {
  seed(`announcement.${id}.date`, date);
  seed(`announcement.${id}.category`, category);
  seed(`announcement.${id}.title`, title);
  seed(`announcement.${id}.excerpt`, excerpt);
}

const publications = [
  ["p1", "Technology", "The Impact of AI on Academic Writing", "Jane Doe, John Smith", "15 Jun 2026"],
  ["p2", "Management", "Sustainable Business Practices in 2026", "Alice Johnson", "10 Jun 2026"],
];
for (const [id, category, title, authors, date] of publications) {
  seed(`publication.${id}.category`, category);
  seed(`publication.${id}.title`, title);
  seed(`publication.${id}.authors`, authors);
  seed(`publication.${id}.date`, date);
}

const activities = [
  ["a1", "New manuscript submitted", "Submission for Journal of English for Academic Excellence", "2 hours ago", "Submission"],
  ["a2", "Peer review completed", "Review completed for 'AI in Education' paper", "5 hours ago", "Review"],
  ["a3", "Chapter accepted", "Chapter accepted for Convergence Vol. IV", "Yesterday", "Publishing"],
];
for (const [id, title, description, time, category] of activities) {
  seed(`activity.${id}.title`, title);
  seed(`activity.${id}.description`, description);
  seed(`activity.${id}.time`, time);
  seed(`activity.${id}.category`, category);
}

seed("home.video.eyebrow", "ADF PUBLISHER CHANNEL");
seed("home.video.title", "Learn with ADF");
seed(
  "home.video.description",
  "Watch tutorials, publishing guidelines, webinars, author interviews, and research insights from the Academic Development Forum YouTube Channel."
);
seed("home.video.feature.1", "Step-by-step submission guides");
seed("home.video.feature.2", "Expert webinar recordings");
seed("home.video.youtubeId", "FSzhc4Q30Hw");

seed("home.statistics.title", "Our Growing Community");
seed(
  "home.statistics.description",
  "Academic Development Forum is rapidly expanding its reach, bringing together scholars, researchers, and readers worldwide."
);
["Research Journals", "Published Articles", "Book Chapters", "Academic Programmes", "Editorial Experts"].forEach((label) =>
  seed(`home.statistics.${label}.label`, label)
);

const whyItems = [
  ["DOI & ISBN Support", "Every publication receives standard identifiers for discoverability and citation."],
  ["Open Access Research", "Default CC BY licensing - readers worldwide, authors retain copyright."],
  ["Multidisciplinary Scope", "Sciences, humanities, education, management, and literature under one roof."],
  ["Literary & Academic", "Peer-reviewed scholarship alongside professionally edited literary imprints."],
  ["Editorial Assistance", "Hands-on support from acquisition through copyediting and production."],
  ["Affordable Publishing", "Transparent, accessible APCs and chapter fees - no hidden barriers."],
  ["Development Programmes", "FDPs, workshops, and short courses for early-career researchers."],
  ["Global Community", "A growing network of authors, reviewers, and editors across regions."],
];
seed("home.why.eyebrow", "Why Choose ADF");
seed("home.why.title", "Built around authors, readers, and rigor");
for (const [title, desc] of whyItems) {
  seed(`home.why.${title}.title`, title);
  seed(`home.why.${title}.desc`, desc);
}

const coreValues = [
  ["Academic Integrity", "Rigorous peer review, ethical publishing, transparent processes."],
  ["Quality", "Editorial care from acquisition through production and distribution."],
  ["Accessibility", "Open access by default - knowledge available to every reader."],
  ["Innovation", "Modern publishing tools, formats, and discovery."],
  ["Inclusivity", "A welcoming home for scholars from every region and tradition."],
  ["Author First", "Authors retain copyright; we exist to amplify their work."],
];
seed("home.coreValues.eyebrow", "Core Values");
seed("home.coreValues.title", "Principles that shape every publication");
for (const [title, desc] of coreValues) {
  seed(`home.coreValues.${title}.title`, title);
  seed(`home.coreValues.${title}.desc`, desc);
}

seed("page.about.nature.title", "Nature of Organization");
seed(
  "page.about.nature.paragraph1",
  "Academic Development Forum (ADF) is an independent academic publishing organization dedicated to disseminating peer-reviewed research, edited volumes, literary publications, and academic development programmes through transparent, ethical, and open-access publishing practices."
);
seed(
  "page.about.nature.paragraph2",
  "Our editorial workflow is transparent, our licensing defaults to open access, and our long-term commitment is to a globally distributed scholarly community."
);
seed(
  "page.about.founder.quote",
  '"ADF was conceived as a forum - where research, literature, and learning sit together as equals. Our promise to authors is simple: rigor, respect, and reach."'
);
seed("page.about.founder.role", "Founder & Publishing Director");
seed("page.about.founder.name", "Dr. Attrait Dovin Fedrick");
seed("page.about.legal.title", "Legal Identity");
[
  ["Organizational Name", "Academic Development Forum (ADF)"],
  ["Legal Status", "Registered Academic Publishing and Research Development Organization"],
  ["Registration Number", "To be updated after official registration"],
  ["Country of Registration", "India"],
  ["Registered Office", "2/2 A West Street, South Amuthunnakudi, Sathankulam (post), Thoothukudi, Tamil Nadu - 628 704, India."],
  ["Year Established", "2025"],
].forEach(([label, value]) => {
  seed(`page.about.legal.${label}.label`, label);
  seed(`page.about.legal.${label}.value`, value);
});

seed("about.journey.eyebrow", "Our Journey");
seed("about.journey.title", "A new publishing house, built with intent");
seed(
  "about.journey.description",
  "From foundation to a connected global network - milestones across research, literature, and academic development."
);
[
  ["ADF Founded", "Academic Development Forum established as an international publication initiative."],
  ["International Journal of English for Academic Excellence", "Flagship peer-reviewed journal launched with open-access mandate."],
  ["Convergence Book Chapter Series", "Bi-monthly edited volumes covering multidisciplinary research."],
  ["Literary Publishing Division", "Novels, novellas, poetry, short stories, and anthologies imprint launched."],
  ["Academic Development Programmes", "FDPs, workshops, and short-term courses for researchers and educators."],
  ["International Expansion", "Conferences, partnerships, and a global editorial network."],
].forEach(([title, desc], index) => {
  seed(`about.journey.${index}.title`, title);
  seed(`about.journey.${index}.desc`, desc);
});

[
  ["Vision", "To be a globally trusted publication house bridging research, literature, and academic development through open knowledge."],
  ["Mission", "Publish rigorously, support authors fully, and make knowledge accessible to every reader without paywalls or barriers."],
  ["Open Access Policy", "ADF defaults to CC BY 4.0 licensing. Authors retain copyright; readers gain unrestricted access to all peer-reviewed content."],
].forEach(([title, text]) => {
  seed(`page.about.pillar.${title}.title`, title);
  seed(`page.about.pillar.${title}.text`, text);
});
seed("page.about.cta.journals", "Explore our journals");
seed("page.about.cta.contact", "Partner with ADF");

const events = [
  ["2026-07-08", "Webinar: Avoiding Predatory Journals", "90 min", "Dr. Anjali Rao", "Online", "480 seats"],
  ["2026-07-15", "Workshop on Academic Writing", "1 day", "Prof. Imran Sheikh", "Online", "120 seats"],
  ["2026-07-22", "FDP on Research Methodology", "3 days", "Multiple Faculty", "Hybrid", "200 seats"],
  ["2026-08-05", "Training: SPSS for Beginners", "2 days", "Dr. Meera Patel", "Online", "80 seats"],
  ["2026-08-19", "Workshop on Publication Ethics", "1 day", "Dr. Saira Khan", "Online", "150 seats"],
];
seed("page.academic-programmes.calendar.previous", "Previous");
seed("page.academic-programmes.calendar.next", "Next");
seed("page.academic-programmes.events.title", "Upcoming Events");
seed("page.academic-programmes.register", "Register via Google Form");
for (const [date, title, duration, speaker, mode, seats] of events) {
  seed(`event.${date}.calendarTitle`, title);
  seed(`event.${date}.title`, title);
  seed(`event.${date}.date`, date);
  seed(`event.${date}.duration`, duration);
  seed(`event.${date}.speaker`, speaker);
  seed(`event.${date}.mode`, mode);
  seed(`event.${date}.seats`, seats);
}

seed("page.contact.email.label", "contact@adf.org");
seed("page.contact.youtube.label", "@adf_publisher");
seed("page.contact.linkedin.label", "Academic Development Forum");
seed("page.contact.instagram.label", "@adf_publisher");
seed("page.contact.office.label", "Academic Development Forum, Registered Office");
["Full name", "Email", "Affiliation", "Subject"].forEach((label) => seed(`page.contact.form.${label}`, label));
seed("page.contact.form.message", "Message");
seed("page.contact.form.submit", "Send message");
seed("page.contact.form.success", "Thank you - we'll get back to you within 3 working days.");

seedGuidelines("page.guidelines.author", {
  eyebrow: "Author Guidelines",
  title: "Preparing and submitting your manuscript",
  lead: "A clear, structured submission helps reviewers focus on your contribution.",
  sections: [
    { h: "Scope & fit", t: "Confirm your work falls within the journal's or volume's stated scope. Read recent issues to gauge style." },
    { h: "Manuscript structure", t: "Title page, abstract (150-250 words), 4-6 keywords, main text, references (APA 7), tables, and figures." },
    { h: "Ethics & originality", t: "All work must be original. Disclose conflicts of interest, funding, and prior dissemination." },
    { h: "Plagiarism", t: "Submissions are screened. Similarity index should generally be under 15%, excluding references." },
    { h: "AI tools", t: "Disclose any use of generative AI in research, writing, or analysis." },
    { h: "Copyright & license", t: "Authors retain copyright. Articles are published under CC BY 4.0 unless otherwise agreed." },
    { h: "Submission", t: "Upload your manuscript via the editorial portal with cover letter and signed author declaration." },
  ],
  action: {
    eyebrow: "FOR AUTHORS",
    title: "Ready to submit your manuscript?",
    description: "Review the author guidelines and submission checklist before you upload.",
  },
});
seed("page.guidelines.author.button.primary", "Author Guidelines");
seed("page.guidelines.author.button.secondary", "Contact Editor");

seedGuidelines("page.guidelines.editor", {
  eyebrow: "Editor Guidelines",
  title: "Editor responsibilities and decision workflow",
  lead: "Editors uphold scientific integrity, fairness, and the editorial scope of each title.",
  sections: [
    { h: "Editorial independence", t: "Editorial decisions are based on academic merit, not commercial or political considerations." },
    { h: "Conflicts of interest", t: "Recuse from handling submissions where you have a real or perceived conflict." },
    { h: "Reviewer selection", t: "Choose two qualified, independent reviewers per manuscript." },
    { h: "Decisions", t: "Communicate decisions promptly with reasoning aligned to reviewer feedback." },
    { h: "Ethics", t: "Investigate suspected misconduct following COPE guidelines." },
    { h: "Confidentiality", t: "Protect author and reviewer identities and unpublished material." },
  ],
  action: {
    eyebrow: "FOR EDITORS",
    title: "Ready to join the Editorial Board?",
    description: "Review the guidelines above and submit your application to become an editor.",
  },
});
seed("page.guidelines.editor.button.secondary", "Contact Us");

seedGuidelines("page.guidelines.reviewer", {
  eyebrow: "Reviewer Guidelines",
  title: "Writing a fair, useful, double-blind review",
  lead: "Reviewers protect the integrity of the record and help authors improve their work.",
  sections: [
    { h: "Confidentiality", t: "Treat all manuscripts as confidential. Do not share, cite, or use unpublished material." },
    { h: "Conflicts of interest", t: "Decline if you have a personal, professional, or financial conflict." },
    { h: "Timeliness", t: "Submit reviews within 21 days. Communicate early if you need an extension." },
    { h: "Evaluation criteria", t: "Originality, methods, evidence, clarity, and contribution to the field." },
    { h: "Tone", t: "Be specific, constructive, and respectful. Critique work, not the author." },
    { h: "Recommendation", t: "Accept, Minor Revisions, Major Revisions, or Reject - with clear justification." },
  ],
  action: {
    eyebrow: "FOR REVIEWERS",
    title: "Ready to join the Reviewer Network?",
    description: "Review the guidelines above and submit your application to become a reviewer.",
  },
});
seed("page.guidelines.reviewer.button.secondary", "Contact Us");

["Editorial Board", "Reviewer Network"].forEach((boardType) => {
  seed(`boardApplication.${boardType}.button`, `Join the ${boardType}`);
  seed(`boardApplication.${boardType}.title`, `Join the ${boardType}`);
  seed(`boardApplication.${boardType}.success`, "Thank you! Your application has been received. We will be in touch shortly.");
  seed(`boardApplication.${boardType}.description`, "Fill out the form below to apply. Your information will be sent to the editorial office.");
});
seed("boardApplication.form.fullName", "Full Name *");
seed("boardApplication.form.email", "Email Address *");
seed("boardApplication.form.affiliation", "Institutional Affiliation *");
seed("boardApplication.form.profile", "Academic Profile or CV Link");
seed("boardApplication.form.comments", "Additional Comments (Optional)");
seed("boardApplication.form.submitting", "Submitting...");
seed("boardApplication.form.submit", "Submit Application");

const journalRows = [
  ["IJEAE", "International Journal of English for Academic Excellence", "Online ISSN - Forthcoming", "Applied linguistics, academic writing, ELT, literature studies.", "Quarterly", "Open Access - CC BY 4.0"],
  ["AJMR", "ADF Journal of Multidisciplinary Research", "Online ISSN - Forthcoming", "Cross-disciplinary research across sciences, humanities, and management.", "Bi-annual", "Open Access - CC BY 4.0"],
  ["AREP", "ADF Review of Education & Pedagogy", "Coming 2026", "Education policy, classroom research, teacher education, EdTech.", "Bi-annual", "Open Access - CC BY 4.0"],
];
seed("page.journals.browse.title", "Browse Journals");
seed("page.journals.browse.authorGuidelines", "Author Guidelines");
seed("page.journals.card.submit", "Submit");
seed("page.journals.card.editorialBoard", "Editorial Board");
seed("page.journals.authorCta.eyebrow", "For Authors");
seed("page.journals.authorCta.title", "Ready to submit your manuscript?");
seed("page.journals.authorCta.description", "Review the author guidelines and submission checklist before you upload.");
seed("page.journals.cta.authorGuidelines", "Author Guidelines");
seed("page.journals.cta.contactEditor", "Contact Editor");
for (const [abbr, title, issn, scope, frequency, access] of journalRows) {
  seed(`journal.${abbr}.title`, title);
  seed(`page.journals.row.ISSN.${issn}`, issn);
  seed(`page.journals.row.Scope.${scope}`, scope);
  seed(`page.journals.row.Frequency.${frequency}`, frequency);
  seed(`page.journals.row.Access.${access}`, access);
}

const chapterFeatures = [
  ["ISBN Assigned", "Every volume receives a standard ISBN."],
  ["Double-Blind Peer Review", "Two reviewers per chapter, identities concealed."],
  ["Open Access", "CC BY 4.0 licensing by default."],
];
for (const [title, desc] of chapterFeatures) {
  seed(`page.chapter-publications.feature.${title}.title`, title);
  seed(`page.chapter-publications.feature.${title}.desc`, desc);
}
seed("page.chapter-publications.workflow.title", "Submission Workflow");
[
  ["01", "Call announced", "Theme published with submission window and editor contacts."],
  ["02", "Chapter submission", "Authors upload full chapter following the ADF template."],
  ["03", "Double-blind review", "Two independent reviewers assess each chapter."],
  ["04", "Revisions & acceptance", "Authors revise; editors confirm acceptance."],
  ["05", "Production & ISBN", "Copyediting, typesetting, and ISBN assignment."],
  ["06", "Open access release", "Volume published online and in print."],
].forEach(([number, title, desc]) => {
  seed(`page.chapter-publications.workflow.${number}.title`, title);
  seed(`page.chapter-publications.workflow.${number}.desc`, desc);
});
seed("page.chapter-publications.cta.title", "Submit a Chapter to Convergence Vol. IV");
seed(
  "page.chapter-publications.cta.description",
  "Open call - Closes 15 Sep 2026. Themes across sciences, humanities, social sciences, education, and management."
);

const genres = [
  ["Novels", "Long-form fiction across literary, commercial, and crossover."],
  ["Novellas", "Short, focused fiction with print and digital release."],
  ["Poetry", "Single-author collections and curated chapbooks."],
  ["Short Stories", "Single-author and themed collections."],
  ["Anthologies", "Editor-curated volumes around themes or movements."],
  ["Hybrid & Experimental", "Works that cross genre and form."],
];
seed("page.literary-publications.genres.title", "Genres we publish");
for (const [title, desc] of genres) {
  seed(`page.literary-publications.genre.${title}.title`, title);
  seed(`page.literary-publications.genre.${title}.desc`, desc);
}
seed("page.literary-publications.benefits.eyebrow", "What you get");
seed("page.literary-publications.benefits.title", "A full author partnership");
[
  "Manuscript appraisal and developmental notes",
  "Professional copyediting and proofreading",
  "Original cover design and interior typesetting",
  "ISBN assignment for print and digital editions",
  "Distribution through major online retailers",
  "Author-retained rights and transparent royalty terms",
].forEach((benefit) => seed(`page.literary-publications.benefit.${benefit}`, benefit));
seed("page.literary-publications.cta.publish", "Publish your book");
seed("page.literary-publications.cta.guidelines", "Submission guidelines");
seed("page.literary-publications.process.title", "How submission works");
[
  "Send a query with synopsis and first 30 pages.",
  "Editorial team responds within 6 weeks.",
  "On acceptance, contract and production schedule.",
  "Editing - design - proofs - release.",
].forEach((step, index) => seed(`page.literary-publications.process.${index + 1}`, step));

const searchItems = [
  ["j1", "International Journal of English for Academic Excellence", "Applied linguistics, academic writing, ELT, literature studies."],
  ["j2", "ADF Journal of Multidisciplinary Research", "Cross-disciplinary research across sciences, humanities, and management."],
  ["j3", "ADF Review of Education & Pedagogy", "Education policy, classroom research, teacher education, EdTech."],
  ["c1", "Convergence: Multidisciplinary Perspectives in Contemporary Research", "A bi-monthly edited volume series. ISBN assigned, double-blind peer review, open access."],
  ["l1", "Shadows of the Forgotten", "A gripping mystery novel exploring the depths of human memory."],
  ["l2", "Echoes of the Silent Valley", "A collection of contemporary poetry reflecting on nature and isolation."],
  ["l3", "The Modern Educator's Handbook", "A comprehensive guide to innovative teaching methodologies."],
  ["l4", "Voices of Tomorrow", "An anthology of short stories by emerging young writers."],
  ["a1", "ADF expands editorial board with 14 new international members", "Welcoming scholars from 9 countries across humanities, sciences, and management."],
  ["a2", "All ADF journals adopt CC BY 4.0 by default", "Authors retain copyright; readers gain unrestricted access worldwide."],
];
seed("page.search.scopeLabel", "Search Scope:");
seed("page.search.viewDetails", "View details");
seed("page.search.noResults.title", "No results found");
seed("page.search.noResults.description", "We couldn't find any exact matches. Try using different keywords or changing your search scope.");
seed("page.search.clear", "Clear search");
for (const [id, title, desc] of searchItems) {
  seed(`search.${id}.title`, title);
  seed(`search.${id}.description`, desc);
}

seed("ecosystem.eyebrow", "ADF Ecosystem");
seed("ecosystem.title", "A connected publishing ecosystem");
seed("ecosystem.description", "Journals, edited volumes, literary works, and academic programmes - woven into one open-access scholarly network.");
[
  ["ADF Ecosystem", "Distribution of activity"],
  ["Growth Roadmap", "Cumulative initiatives by year"],
  ["Research Coverage", "Outputs by discipline"],
].forEach(([title, subtitle]) => {
  seed(`ecosystem.chart.${title}.title`, title);
  seed(`ecosystem.chart.${title}.subtitle`, subtitle);
});

const policies: Record<string, string> = {
  "ethics.intro":
    "Academic Development Forum is committed to maintaining the highest standards of integrity, transparency, and ethical publishing. Every manuscript submitted to our journals and edited volumes undergoes a rigorous editorial and peer-review process designed to ensure originality, academic merit, and scholarly contribution.",
  "ethics.expectation":
    "Authors, reviewers, editors, and editorial board members are expected to uphold professional conduct throughout the publication process.",
  "ethics.warning":
    "ADF does not tolerate plagiarism, data fabrication, image manipulation, duplicate publication, unethical authorship practices, or conflicts of interest that compromise research integrity.",
  "cope.intro":
    "Academic Development Forum follows the internationally accepted principles established by the Committee on Publication Ethics (COPE). Editorial decisions are based solely on academic merit, originality, ethical compliance, and relevance to the journal scope.",
  "cope.heading": "Editors follow recognized ethical procedures when handling:",
  "cope.note": "ADF continually updates its editorial practices to reflect internationally accepted publishing standards.",
  "retraction.heading": "Articles may be retracted when reliable evidence demonstrates:",
  "retraction.archive.title": "Permanent Archive",
  "retraction.archive.text":
    "Retractions remain permanently available within the journal archive to preserve the integrity of the scholarly record.",
  "retraction.notice.title": "Transparent Notices",
  "retraction.notice.text": "Retraction notices clearly explain the reason for retraction while maintaining transparency for readers.",
  "correction.intro":
    "When errors are identified after publication, ADF will publish appropriate corrections to maintain the accuracy of the scholarly record.",
  "correction.heading": "Corrections may include:",
  "correction.warning": "Major scientific errors that invalidate research findings may require article retraction rather than correction.",
  "ai.intro": "ADF recognizes that artificial intelligence tools may assist authors during manuscript preparation.",
  "ai.allowed.title": "Allowed Uses",
  "ai.limitations.title": "Strict Limitations",
  "ai.limitations.1": "AI tools must never be listed as authors.",
  "ai.limitations.2": "Authors remain fully responsible for the accuracy, originality, and integrity of their work.",
  "ai.limitations.3": "Any substantial use of AI-generated content should be transparently disclosed in the manuscript.",
  "ai.limitations.4": "Editors may request clarification regarding AI-assisted content whenever necessary.",
  "plagiarism.intro": "Every manuscript submitted to Academic Development Forum is screened using plagiarism detection software before peer review.",
  "plagiarism.similarity": "Similarity Index should remain below 15%",
  "plagiarism.exclusions": "Excluding references, quotations, and standard methodological descriptions",
  "plagiarism.warning1": "Manuscripts exhibiting excessive similarity, duplicate publication, or unattributed content may be rejected without peer review.",
  "plagiarism.warning2": "Repeated ethical violations may result in future submission restrictions.",
  "copyright.hero.title": "Authors retain copyright",
  "copyright.hero.text":
    "Upon publication, articles are distributed under the Creative Commons Attribution (CC BY 4.0) License unless otherwise stated.",
  "copyright.permits.title": "This license permits readers to:",
  "copyright.credit": "*Provided appropriate credit is given to the original authors.",
  "copyright.ownership": "ADF does not claim ownership of authors' intellectual property.",
  "independence.quote":
    '"Editorial decisions are made independently of commercial, financial, institutional, or political influence. Publishers do not interfere with editorial decisions."',
  "independence.heading": "Editors evaluate submissions solely on:",
  "conflict.disclosure.title": "Mandatory Disclosure",
  "conflict.disclosure.text":
    "Authors, reviewers, and editors must disclose any financial, institutional, or personal relationships that could influence the publication process.",
  "conflict.reassignment.title": "Independent Reassignment",
  "conflict.reassignment.text": "Editors may reassign manuscripts whenever a conflict exists to ensure complete fairness.",
  "conflict.transparency.title": "Guaranteed Transparency",
  "conflict.transparency.text": "Transparency ensures fairness throughout the entire peer review process.",
  "peerReview.hero.title": "Double-Blind Review",
  "peerReview.hero.text": "All research articles undergo a rigorous double-blind peer review process to eliminate bias and ensure objective evaluation.",
  "peerReview.reviewers.title": "Independent Reviewers",
  "peerReview.reviewers.text": "Each manuscript is evaluated by at least two independent reviewers with specific expertise in the relevant discipline.",
  "peerReview.criteria.title": "Decision Criteria",
  "peerReview.criteria.text": "Decisions are based upon reviewer recommendations, originality, methodological quality, ethical compliance, and scholarly contribution.",
  "openAccess.title": "Unrestricted access to scholarly knowledge.",
  "openAccess.text": "All accepted publications are made freely accessible online without subscription barriers, promoting global dissemination of research.",
  "openAccess.license": "Distributed under the CC BY 4.0 license",
};
Object.entries(policies).forEach(([key, value]) => seed(`page.policies.${key}`, value));
[
  "Publication Ethics",
  "COPE Compliance",
  "Retraction Policy",
  "Correction Policy",
  "AI Usage Policy",
  "Anti-Plagiarism Policy",
  "Copyright Policy",
  "Editorial Independence",
  "Conflict of Interest Policy",
  "Peer Review Policy",
  "Open Access Policy",
].forEach((title) => seed(`page.policies.nav.${title}`, title));

seed("admin.login.title", "Admin Login");
seed("admin.login.description", "Sign in to manage site content.");
seed("admin.login.email", "Email");
seed("admin.login.password", "Password");
seed("admin.layout.brand", "Inline CMS");
seed("admin.layout.title", "Inline editing mode");
seed("admin.layout.viewSite", "View Site");
seed("admin.layout.logout", "Log Out");
seed("admin.nav.Dashboard", "Dashboard");
seed("admin.nav.Edit Live Site", "Edit Live Site");
seed("admin.dashboard.title", "Inline CMS is active");
seed(
  "admin.dashboard.description",
  "Open the live website, hover editable text or images, click the pencil, make the change, and save. There is no separate content table to manage."
);
seed("admin.dashboard.edit.title", "Edit live website");
seed("admin.dashboard.edit.description", "Use hover pencils directly on public pages.");
seed("admin.dashboard.logout.title", "Log out");
seed("admin.dashboard.logout.description", "End this editing session.");
seed("admin.dashboard.behavior.title", "Editing behavior");
seed(
  "admin.dashboard.behavior.description",
  "Text edits, image URL edits, and uploaded images are saved through the backend CMS API into PostgreSQL. Visitors see the saved content automatically."
);

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
