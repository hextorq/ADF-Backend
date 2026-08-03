import type { Request, Response } from "express";
import { pool } from "../../db/pool.js";

export const getAllProgrammes = async (req: Request, res: Response) => {
  const result = await pool.query(
    "SELECT * FROM academic_programmes ORDER BY date ASC"
  );
  res.json(result.rows);
};

export const createProgramme = async (req: Request, res: Response) => {
  const { title, type, date, duration, speaker, mode, seats, google_form_url } = req.body;
  
  const result = await pool.query(
    `INSERT INTO academic_programmes 
      (title, type, date, duration, speaker, mode, seats, google_form_url) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
     RETURNING *`,
    [title, type, date, duration, speaker, mode, seats, google_form_url]
  );
  
  res.status(201).json(result.rows[0]);
};

export const updateProgramme = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, type, date, duration, speaker, mode, seats, google_form_url } = req.body;

  const result = await pool.query(
    `UPDATE academic_programmes SET 
      title = COALESCE($1, title),
      type = COALESCE($2, type),
      date = COALESCE($3, date),
      duration = COALESCE($4, duration),
      speaker = COALESCE($5, speaker),
      mode = COALESCE($6, mode),
      seats = COALESCE($7, seats),
      google_form_url = COALESCE($8, google_form_url),
      updated_at = CURRENT_TIMESTAMP
     WHERE id = $9 RETURNING *`,
    [title, type, date, duration, speaker, mode, seats, google_form_url, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Programme not found" });
  }

  res.json(result.rows[0]);
};

export const deleteProgramme = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await pool.query("DELETE FROM academic_programmes WHERE id = $1 RETURNING *", [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Programme not found" });
  }

  res.json({ success: true });
};
