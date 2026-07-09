import { pool } from "../../db/pool.js";

export type ContactSubmission = {
  fullName: string;
  email: string;
  affiliation?: string;
  subject: string;
  message: string;
};

export type BoardApplication = {
  fullName: string;
  email: string;
  affiliation: string;
  profileLink?: string;
  boardType: "Editorial Board" | "Reviewer Network";
  message?: string;
};

export async function saveContactSubmission(data: ContactSubmission) {
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO contact_submissions (full_name, email, affiliation, subject, message)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [data.fullName, data.email, data.affiliation ?? null, data.subject, data.message]
  );
  return rows[0];
}

export async function saveBoardApplication(data: BoardApplication) {
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO board_applications (full_name, email, affiliation, profile_link, board_type, message)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      data.fullName,
      data.email,
      data.affiliation,
      data.profileLink || null,
      data.boardType,
      data.message || null,
    ]
  );
  return rows[0];
}
