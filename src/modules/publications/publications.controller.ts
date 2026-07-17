import type { Request, Response } from "express";
import { pool } from "../../db/pool.js";
import { sendNotificationEmail } from "../../lib/notifications.js";

// --- LITERARY PUBLICATIONS ADMIN ---

export const getLiterarySubmissions = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT id, book_title, author_name, book_genre, package_id, payment_status, current_stage, editor_assigned, isbn, created_at FROM literary_submissions ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
};

export const updateLiteraryStage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { stage, editor_assigned, isbn } = req.body;
  
  try {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (stage) {
      updates.push(`current_stage = $${paramIndex++}`);
      values.push(stage);
    }
    if (editor_assigned !== undefined) {
      updates.push(`editor_assigned = $${paramIndex++}`);
      values.push(editor_assigned);
    }
    if (isbn !== undefined) {
      updates.push(`isbn = $${paramIndex++}`);
      values.push(isbn);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE literary_submissions SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    const updated = result.rows[0];
    if (!updated) return res.status(404).json({ error: "Not found" });

    // Send notification
    if (stage) {
      await sendNotificationEmail({
        to: updated.author_email,
        subject: `Update on your Literary Submission: ${updated.book_title}`,
        message: `Your manuscript is now in the following stage: ${stage}.`
      });
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update submission" });
  }
};

export const publishToBookStore = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // Get the submission
    const subResult = await pool.query("SELECT * FROM literary_submissions WHERE id = $1", [id]);
    const sub = subResult.rows[0];
    if (!sub) return res.status(404).json({ error: "Submission not found" });
    
    // Check if already published
    if (sub.book_store_id) {
      return res.status(400).json({ error: "Already published to bookstore" });
    }

    // Insert into Bookstore DB (books table created in 005_bookstore.sql)
    // We assume an author needs to be created first or linked. 
    // For simplicity, we just create an author if they don't exist by name.
    
    let authorId;
    const authorRes = await pool.query("SELECT id FROM authors WHERE name = $1 LIMIT 1", [sub.author_name]);
    if (authorRes.rows.length > 0) {
      authorId = authorRes.rows[0].id;
    } else {
      const newAuth = await pool.query("INSERT INTO authors (name, bio) VALUES ($1, $2) RETURNING id", [sub.author_name, sub.author_bio || '']);
      authorId = newAuth.rows[0].id;
    }

    const price = 15.99; // Default mocked price for new publications
    const bookRes = await pool.query(
      `INSERT INTO books (title, author_id, cover_image, price, original_price, category, format, is_new_release, isbn, synopsis) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [sub.book_title, authorId, sub.cover_url || '', price, null, sub.book_genre, 'Paperback', true, sub.isbn || '', sub.synopsis]
    );
    const bookId = bookRes.rows[0].id;

    // Link back to submission
    await pool.query("UPDATE literary_submissions SET book_store_id = $1, current_stage = 'Book Store' WHERE id = $2", [bookId, id]);

    await sendNotificationEmail({
      to: sub.author_email,
      subject: `Your Book is Live! - ${sub.book_title}`,
      message: `Congratulations! Your book has been published to the ADF Book Store.`
    });

    res.json({ success: true, bookId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to publish to store" });
  }
};


// --- CHAPTER PUBLICATIONS ---

export const getChapterVolumes = async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM chapter_volumes ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch volumes" });
  }
};

export const createChapterVolume = async (req: Request, res: Response) => {
  const { title, theme, description, submission_deadline } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO chapter_volumes (title, theme, description, submission_deadline) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, theme, description, submission_deadline]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create volume" });
  }
};

export const submitChapter = async (req: Request, res: Response) => {
  // Simplified for now - assumes authors are passed as JSON array
  const { volume_id, chapter_title, abstract, keywords, authors } = req.body;
  const manuscript = (req.files as any)?.manuscript?.[0];
  
  if (!manuscript) return res.status(400).json({ error: "Manuscript is required" });
  const manuscriptUrl = `/uploads/${manuscript.filename}`;
  const submissionId = `CHAP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    await pool.query("BEGIN");
    
    // Insert Submission
    await pool.query(
      `INSERT INTO chapter_submissions (id, volume_id, chapter_title, abstract, keywords, manuscript_url) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [submissionId, volume_id, chapter_title, abstract, keywords, manuscriptUrl]
    );

    // Insert Authors
    let primaryEmail = "";
    if (typeof authors === 'string') {
      const parsed = JSON.parse(authors);
      for (const auth of parsed) {
        if (auth.is_primary) primaryEmail = auth.email;
        await pool.query(
          `INSERT INTO chapter_authors (submission_id, is_primary, name, email, institution) VALUES ($1, $2, $3, $4, $5)`,
          [submissionId, auth.is_primary, auth.name, auth.email, auth.institution]
        );
      }
    }

    await pool.query("COMMIT");

    if (primaryEmail) {
      await sendNotificationEmail({
        to: primaryEmail,
        subject: `Chapter Submission Received: ${chapter_title}`,
        message: `Your chapter has been received. Your tracking ID is ${submissionId}.`
      });
    }

    res.json({ success: true, submissionId });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to submit chapter" });
  }
};

export const getChapterSubmissions = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT cs.id, cs.chapter_title, cs.stage, cs.review_status, cs.payment_status, cs.created_at, cv.title as volume_title
      FROM chapter_submissions cs
      JOIN chapter_volumes cv ON cs.volume_id = cv.id
      ORDER BY cs.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
};

export const updateChapterStage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { stage, review_status, editor_assigned } = req.body;
  
  try {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (stage) {
      updates.push(`stage = $${paramIndex++}`);
      values.push(stage);
    }
    if (review_status !== undefined) {
      updates.push(`review_status = $${paramIndex++}`);
      values.push(review_status);
    }
    if (editor_assigned !== undefined) {
      updates.push(`editor_assigned = $${paramIndex++}`);
      values.push(editor_assigned);
    }
    
    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });

    values.push(id);
    const result = await pool.query(
      `UPDATE chapter_submissions SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    const updated = result.rows[0];
    
    // fetch primary author
    if (stage) {
       const authRes = await pool.query("SELECT email FROM chapter_authors WHERE submission_id = $1 AND is_primary = true", [id]);
       if (authRes.rows.length > 0) {
         await sendNotificationEmail({
           to: authRes.rows[0].email,
           subject: `Update on your Chapter Submission: ${updated.chapter_title}`,
           message: `Your chapter submission stage has been updated to: ${stage}.`
         });
       }
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update" });
  }
};
