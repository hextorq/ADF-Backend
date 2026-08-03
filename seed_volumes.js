import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const VOLUMES = [
  { title: "Convergence Vol. I", theme: "Digital Transformation in Contemporary Education and Pedagogy", submission_deadline: "2025-01-01", pages: 124, cover_url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop", status: "published" },
  { title: "Convergence Vol. II", theme: "Sustainable Development Goals & Modern Society", submission_deadline: "2025-03-01", pages: 142, cover_url: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=600&auto=format&fit=crop", status: "published" },
  { title: "Convergence Vol. III", theme: "AI, Machine Learning, and Ethics in Technology", submission_deadline: "2025-05-01", pages: 156, cover_url: "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=600&auto=format&fit=crop", status: "published" },
  { title: "Convergence Vol. IV", theme: "Global Healthcare Innovations & Management", submission_deadline: "2025-07-01", pages: 138, cover_url: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=600&auto=format&fit=crop", status: "published" }
];

async function seed() {
  for (const v of VOLUMES) {
    await pool.query(
      "INSERT INTO chapter_volumes (title, theme, submission_deadline, pages, cover_url, status) VALUES ($1, $2, $3, $4, $5, $6)",
      [v.title, v.theme, v.submission_deadline, v.pages, v.cover_url, v.status]
    );
  }
  console.log("Seeded volumes!");
  process.exit(0);
}

seed();
