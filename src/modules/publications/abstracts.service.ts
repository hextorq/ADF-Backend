import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../../db/pool.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_FILE = path.resolve(__dirname, "../../../uploads/abstract_submissions.json");

export interface AbstractSubmission {
  id: string;
  author_name: string;
  author_type: string;
  department: string;
  institution: string;
  email: string;
  phone: string;
  research_area_id: string;
  research_area_name: string;
  abstract_title: string;
  abstract_text: string;
  word_count: number;
  keywords: string;
  is_sole_author: boolean;
  payment_status: "Paid" | "Pending";
  payment_ref: string;
  payment_screenshot_url?: string | null;
  manuscript_url?: string | null;
  review_status: "Pending Review" | "Accepted" | "Revision Required" | "Rejected";
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

const SEED_ABSTRACTS: AbstractSubmission[] = [
  {
    id: "ADF-ABS-824102-101",
    author_name: "Dr. Ananya Sen",
    author_type: "Faculty Member",
    department: "Department of Computer Science",
    institution: "National Institute of Technology, Trichy",
    email: "ananya.sen@nitt.edu",
    phone: "+91 98401 23456",
    research_area_id: "computer-science",
    research_area_name: "Computer Science",
    abstract_title: "Predictive Analytics for Sustainable Energy Distribution in Hybrid Micro-Grids",
    abstract_text: "This research addresses the optimization of renewable resource balancing in modern decentralized micro-grids. Leveraging deep reinforcement learning and temporal convolutional networks, our proposed model forecasts intermittent solar-wind generation with an RMSE of 0.042 across seasonal benchmarks. Numerical simulations indicate an 18.4% reduction in peak-hour transmission curtailment compared to conventional linear programming heuristics. The framework offers practical utility for municipal clean-energy deployment initiatives.",
    word_count: 228,
    keywords: "Smart Grids, Deep Learning, Renewable Energy, Predictive Dispatch, Sustainable Power",
    is_sole_author: true,
    payment_status: "Paid",
    payment_ref: "UPI/638291048201",
    payment_screenshot_url: null,
    manuscript_url: null,
    review_status: "Accepted",
    created_at: "2026-11-04T08:15:00.000Z",
    updated_at: "2026-11-04T08:15:00.000Z",
  },
  {
    id: "ADF-ABS-824102-102",
    author_name: "Karthik Subramanian",
    author_type: "Research Scholar",
    department: "Department of English",
    institution: "Loyola College, Chennai",
    email: "karthik.subramanian@loyola.edu",
    phone: "+91 94440 98765",
    research_area_id: "english-languages",
    research_area_name: "English and Languages",
    abstract_title: "Decolonial Narratives and Eco-Critical Metaphors in Contemporary South Asian Poetry",
    abstract_text: "This paper undertakes a comparative eco-critical examination of vernacular poetry translated into contemporary Indian English. Drawing on postcolonial ecocriticism and spatial theory, the study analyzes how indigenous ecological vocabularies disrupt Cartesian nature-culture binaries in recent literary anthologies. The textual analysis illustrates how peripheral poetic meters register anthropogenic climate disruption through localized environmental mythologies, providing vital counter-narratives to dominant developmental discourses.",
    word_count: 216,
    keywords: "Eco-Criticism, Decolonial Poetics, Translation Studies, Indian English Poetry, Environmental Humanities",
    is_sole_author: true,
    payment_status: "Paid",
    payment_ref: "UPI/819203810294",
    payment_screenshot_url: null,
    manuscript_url: null,
    review_status: "Pending Review",
    created_at: "2026-11-04T09:40:00.000Z",
    updated_at: "2026-11-04T09:40:00.000Z",
  },
  {
    id: "ADF-ABS-824102-103",
    author_name: "Meera R. Nair",
    author_type: "Faculty Member",
    department: "Department of Education",
    institution: "Kerala University of Health & Allied Sciences",
    email: "meera.nair@kuhs.ac.in",
    phone: "+91 97451 12340",
    research_area_id: "education",
    research_area_name: "Education",
    abstract_title: "Evaluating Generative AI Integration in Higher Education Pedagogical Assessment",
    abstract_text: "The integration of generative artificial intelligence across university curricula necessitates a comprehensive reassessment of authentic learning outcomes. This study surveys 340 university educators to evaluate institutional readiness, rubric modifications, and critical-inquiry task design. Exploratory factor analysis reveals three distinct instructional response categories: defensive restriction, passive adoption, and scaffolded dialogic evaluation. Recommendations for higher education governance and faculty development programs are formulated.",
    word_count: 234,
    keywords: "Generative AI, Higher Education, Authentic Assessment, Pedagogy, Faculty Development",
    is_sole_author: true,
    payment_status: "Pending",
    payment_ref: "Pay via WhatsApp",
    payment_screenshot_url: null,
    manuscript_url: null,
    review_status: "Revision Required",
    created_at: "2026-11-04T10:10:00.000Z",
    updated_at: "2026-11-04T10:10:00.000Z",
  },
];

function ensureBackupFileExists(): void {
  try {
    const dir = path.dirname(BACKUP_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(BACKUP_FILE)) {
      fs.writeFileSync(BACKUP_FILE, JSON.stringify(SEED_ABSTRACTS, null, 2), "utf8");
    }
  } catch (err) {
    console.warn("[AbstractService] Could not initialize backup file:", err);
  }
}

function readBackupSubmissions(): AbstractSubmission[] {
  ensureBackupFileExists();
  try {
    const raw = fs.readFileSync(BACKUP_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("[AbstractService] Error reading backup file:", err);
    return SEED_ABSTRACTS;
  }
}

function writeBackupSubmissions(data: AbstractSubmission[]): void {
  ensureBackupFileExists();
  try {
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("[AbstractService] Error writing backup file:", err);
  }
}

export const abstractService = {
  async getAll(): Promise<AbstractSubmission[]> {
    try {
      const res = await pool.query(
        "SELECT * FROM abstract_submissions ORDER BY created_at DESC"
      );
      if (res.rows && res.rows.length > 0) {
        return res.rows;
      }
    } catch (err) {
      console.warn("[AbstractService] DB query failed, falling back to disk store:", (err as Error).message);
    }
    return readBackupSubmissions();
  },

  async create(entry: Omit<AbstractSubmission, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string }): Promise<AbstractSubmission> {
    const id = entry.id || `ADF-ABS-${Math.floor(100000 + Math.random() * 900000)}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();
    const sub: AbstractSubmission = {
      ...entry,
      id,
      created_at: entry.created_at || now,
      updated_at: entry.updated_at || now,
    };
    // 1. Always write to disk store first so no data is ever lost
    const current = readBackupSubmissions();
    const updated = [sub, ...current.filter((s) => s.id !== sub.id)];
    writeBackupSubmissions(updated);

    // 2. Try inserting into database if DB is reachable
    try {
      await pool.query(
        `INSERT INTO abstract_submissions (
          id, author_name, author_type, department, institution, email, phone,
          research_area_id, research_area_name, abstract_title, abstract_text,
          word_count, keywords, is_sole_author, payment_status, payment_ref,
          payment_screenshot_url, manuscript_url, review_status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        ON CONFLICT (id) DO UPDATE SET
          author_name = EXCLUDED.author_name,
          payment_status = EXCLUDED.payment_status,
          updated_at = NOW()`,
        [
          sub.id,
          sub.author_name,
          sub.author_type,
          sub.department,
          sub.institution,
          sub.email,
          sub.phone,
          sub.research_area_id,
          sub.research_area_name,
          sub.abstract_title,
          sub.abstract_text,
          sub.word_count,
          sub.keywords,
          sub.is_sole_author,
          sub.payment_status,
          sub.payment_ref,
          sub.payment_screenshot_url || null,
          sub.manuscript_url || null,
          sub.review_status,
          sub.created_at,
          sub.updated_at,
        ]
      );
    } catch (err) {
      console.warn("[AbstractService] DB insert skipped/fallback used:", (err as Error).message);
    }

    return sub;
  },

  async updateStatus(id: string, review_status: AbstractSubmission["review_status"], admin_notes?: string): Promise<AbstractSubmission | null> {
    const list = readBackupSubmissions();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    list[idx].review_status = review_status;
    list[idx].updated_at = new Date().toISOString();
    if (admin_notes !== undefined) {
      list[idx].admin_notes = admin_notes;
    }
    writeBackupSubmissions(list);

    try {
      await pool.query(
        "UPDATE abstract_submissions SET review_status = $1, admin_notes = COALESCE($2, admin_notes), updated_at = NOW() WHERE id = $3",
        [review_status, admin_notes || null, id]
      );
    } catch (err) {
      console.warn("[AbstractService] DB status update failed:", (err as Error).message);
    }

    return list[idx];
  },

  async updatePayment(id: string, payment_status: "Paid" | "Pending"): Promise<AbstractSubmission | null> {
    const list = readBackupSubmissions();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    list[idx].payment_status = payment_status;
    list[idx].updated_at = new Date().toISOString();
    writeBackupSubmissions(list);

    try {
      await pool.query(
        "UPDATE abstract_submissions SET payment_status = $1, updated_at = NOW() WHERE id = $2",
        [payment_status, id]
      );
    } catch (err) {
      console.warn("[AbstractService] DB payment update failed:", (err as Error).message);
    }

    return list[idx];
  },

  async updateAttachments(
    id: string,
    attachments: { manuscript_url?: string | null; payment_screenshot_url?: string | null }
  ): Promise<AbstractSubmission | null> {
    const list = readBackupSubmissions();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    if (attachments.manuscript_url !== undefined) {
      list[idx].manuscript_url = attachments.manuscript_url;
    }
    if (attachments.payment_screenshot_url !== undefined) {
      list[idx].payment_screenshot_url = attachments.payment_screenshot_url;
    }
    list[idx].updated_at = new Date().toISOString();
    writeBackupSubmissions(list);

    try {
      await pool.query(
        "UPDATE abstract_submissions SET manuscript_url = COALESCE($1, manuscript_url), payment_screenshot_url = COALESCE($2, payment_screenshot_url), updated_at = NOW() WHERE id = $3",
        [attachments.manuscript_url || null, attachments.payment_screenshot_url || null, id]
      );
    } catch (err) {
      console.warn("[AbstractService] DB attachments update failed:", (err as Error).message);
    }

    return list[idx];
  },

  async delete(id: string): Promise<boolean> {
    const list = readBackupSubmissions();
    const filtered = list.filter((s) => s.id !== id);
    writeBackupSubmissions(filtered);

    try {
      await pool.query("DELETE FROM abstract_submissions WHERE id = $1", [id]);
    } catch (err) {
      console.warn("[AbstractService] DB delete failed:", (err as Error).message);
    }

    return true;
  },
};
