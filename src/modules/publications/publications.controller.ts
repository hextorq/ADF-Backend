import type { Request, Response } from "express";
import { pool } from "../../db/pool.js";
import { sendNotificationEmail } from "../../lib/notifications.js";

// --- LITERARY PUBLICATIONS ADMIN ---

export const getLiterarySubmissions = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM literary_submissions ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
};

export const updateLiterarySubmission = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { 
    current_stage, editor_assigned, isbn, 
    author_name, author_email, author_phone, author_country, author_bio,
    book_title, book_subtitle, book_genre, book_language, word_count, synopsis
  } = req.body;
  
  try {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    const fieldsToUpdate = {
      current_stage, editor_assigned, isbn,
      author_name, author_email, author_phone, author_country, author_bio,
      book_title, book_subtitle, book_genre, book_language, word_count, synopsis
    };

    for (const [key, value] of Object.entries(fieldsToUpdate)) {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
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

    // Send notification if stage was explicitly updated
    if (current_stage) {
      await sendNotificationEmail({
        to: updated.author_email,
        subject: `Update on your Literary Submission: ${updated.book_title}`,
        message: `Your manuscript is now in the following stage: ${current_stage}.`
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
      `INSERT INTO books (title, author_id, author_name, cover_url, price, category, badge, isbn, description) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [sub.book_title, authorId, sub.author_name, sub.cover_url || '', price, sub.book_genre || 'Literature', 'New Release', sub.isbn || '', sub.synopsis || '']
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

export const deleteLiterarySubmission = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM literary_submissions WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete submission" });
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
  const { title, theme, description, submission_deadline, pages } = req.body;
  const cover_url = req.file ? `/uploads/${req.file.filename}` : req.body.cover_url;
  try {
    const result = await pool.query(
      "INSERT INTO chapter_volumes (title, theme, description, submission_deadline, cover_url, pages) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [title, theme, description, submission_deadline, cover_url, pages]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create volume" });
  }
};

export const updateChapterVolume = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, theme, description, submission_deadline, cover_url, pages, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE chapter_volumes SET 
        title=COALESCE($1, title), 
        theme=COALESCE($2, theme), 
        description=COALESCE($3, description), 
        submission_deadline=COALESCE($4, submission_deadline), 
        cover_url=COALESCE($5, cover_url), 
        pages=COALESCE($6, pages), 
        status=COALESCE($7, status), 
        updated_at=CURRENT_TIMESTAMP 
       WHERE id=$8 RETURNING *`,
      [title, theme, description, submission_deadline, cover_url, pages, status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update volume" });
  }
};

export const deleteChapterVolume = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM chapter_volumes WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete volume" });
  }
};

export const submitChapter = async (req: Request, res: Response) => {
  // Simplified for now - assumes authors are passed as JSON array
    const { volume_id, chapter_title, abstract, keywords, authors, transaction_id } = req.body;
  const manuscript = (req.files as any)?.manuscript?.[0];
  const paymentScreenshot = (req.files as any)?.payment_screenshot?.[0];
  
  if (!manuscript) return res.status(400).json({ error: "Manuscript is required" });
  if (!transaction_id) return res.status(400).json({ error: "Transaction ID is required" });
  
  const manuscriptUrl = `/uploads/${manuscript.filename}`;
  const paymentScreenshotUrl = paymentScreenshot ? `/uploads/${paymentScreenshot.filename}` : null;
  
  const submissionId = `CHAP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    await pool.query("BEGIN");
    
    // Insert Submission
    await pool.query(
      `INSERT INTO chapter_submissions (id, volume_id, chapter_title, abstract, keywords, manuscript_url, transaction_id, payment_screenshot_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [submissionId, volume_id, chapter_title, abstract, keywords, manuscriptUrl, transaction_id, paymentScreenshotUrl]
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
      SELECT 
        cs.*, 
        cv.title as volume_title,
        (
          SELECT json_agg(json_build_object(
            'id', a.id,
            'is_primary', a.is_primary,
            'name', a.name,
            'email', a.email,
            'phone', a.phone,
            'institution', a.institution,
            'country', a.country
          )) 
          FROM chapter_authors a 
          WHERE a.submission_id = cs.id
        ) as authors
      FROM chapter_submissions cs
      JOIN chapter_volumes cv ON cs.volume_id = cv.id
      ORDER BY cs.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
};

export const updateChapterStage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { stage } = req.body;
  
  try {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (stage) {
      updates.push(`status = $${paramIndex++}`);
      values.push(stage);
    }
    
    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });

    values.push(id);
    const result = await pool.query(
      `UPDATE chapter_submissions SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    const updated = result.rows[0];
    
    // fetch primary author (or just use author_email from the submission itself since we have it in chapter_submissions)
    if (stage) {
       if (updated && updated.author_email) {
         await sendNotificationEmail({
           to: updated.author_email,
           subject: `Update on your Chapter Submission: ${updated.chapter_title}`,
           message: `Your chapter submission stage has been updated to: ${stage}.`
         });
       }
    }

    res.json({ success: true, updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update submission" });
  }
};

export const deleteChapterSubmission = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM chapter_submissions WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete submission" });
  }
};
