import type { Request, Response } from "express";
import { pool } from "../../db/pool.js";
import { UploadError, saveUpload } from "../../lib/uploads.js";
import { sendNotificationEmail } from "../../lib/notifications.js";
import { abstractService } from "./abstracts.service.js";

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
    book_title, book_subtitle, book_genre, book_language, word_count, synopsis,
    campaign_id, campaign_name, submission_type, author_instagram
  } = req.body;
  
  try {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    const fieldsToUpdate = {
      current_stage, editor_assigned, isbn,
      author_name, author_email, author_phone, author_country, author_bio,
      book_title, book_subtitle, book_genre, book_language, word_count, synopsis,
      campaign_id, campaign_name, submission_type, author_instagram
    };

    for (const [key, value] of Object.entries(fieldsToUpdate)) {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    }
    
    updates.push(`updated_at = NOW()`);
    
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
  
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  
  const coverFile = files?.['cover_image']?.[0];
  const pdfFileObj = files?.['pdf_file']?.[0];

  try {
    const cover_url = coverFile ? (await saveUpload(coverFile, "publications")).url : req.body.cover_url;
    const pdf_url = pdfFileObj ? (await saveUpload(pdfFileObj, "publications")).url : req.body.pdf_url;

    const result = await pool.query(
      "INSERT INTO chapter_volumes (title, theme, description, submission_deadline, cover_url, pages, pdf_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [title, theme, description, submission_deadline, cover_url, pages, pdf_url]
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err instanceof UploadError) {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to create volume" });
  }
};

export const updateChapterVolume = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, theme, description, submission_deadline, pages, status } = req.body;
  
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const coverFile = files?.['cover_image']?.[0];
  const pdfFileObj = files?.['pdf_file']?.[0];

  try {
    const cover_url = coverFile ? (await saveUpload(coverFile, "publications")).url : req.body.cover_url;
    const pdf_url = pdfFileObj ? (await saveUpload(pdfFileObj, "publications")).url : req.body.pdf_url;

    const result = await pool.query(
      `UPDATE chapter_volumes SET 
        title=COALESCE($1, title), 
        theme=COALESCE($2, theme), 
        description=COALESCE($3, description), 
        submission_deadline=COALESCE($4, submission_deadline), 
        cover_url=COALESCE($5, cover_url), 
        pages=COALESCE($6, pages), 
        status=COALESCE($7, status), 
        pdf_url=COALESCE($8, pdf_url),
        updated_at=CURRENT_TIMESTAMP 
       WHERE id=$9 RETURNING *`,
      [title, theme, description, submission_deadline, cover_url, pages, status, pdf_url, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err instanceof UploadError) {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
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
  const {
    volume_id,
    chapter_title,
    abstract,
    keywords,
    authors,
    transaction_id,
    formatted_manuscript_url,
    formatting_version,
    formatting_issues,
    author_confirmed_formatting,
  } = req.body;
  const manuscript = (req.files as any)?.manuscript?.[0];
  const paymentScreenshot = (req.files as any)?.payment_screenshot?.[0];
  
  if (!manuscript) return res.status(400).json({ error: "Manuscript is required" });
  if (!transaction_id) return res.status(400).json({ error: "Transaction ID is required" });

  const submissionId = `CHAP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  let inTransaction = false;

  try {
    const manuscriptUrl = (await saveUpload(manuscript, "chapters")).url;
    const paymentScreenshotUrl = paymentScreenshot
      ? (await saveUpload(paymentScreenshot, "payments")).url
      : null;

    await pool.query("BEGIN");
    inTransaction = true;
    
    // Insert Submission
    await pool.query(
      `INSERT INTO chapter_submissions (
        id, volume_id, chapter_title, abstract, keywords, manuscript_url, transaction_id, payment_screenshot_url,
        formatted_manuscript_url, formatting_version, formatting_status, formatting_issues, author_confirmed_formatting
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        submissionId,
        volume_id,
        chapter_title,
        abstract,
        keywords,
        manuscriptUrl,
        transaction_id,
        paymentScreenshotUrl,
        formatted_manuscript_url || null,
        formatting_version || (formatted_manuscript_url ? "ADF Format v1.0" : null),
        formatted_manuscript_url ? "Completed" : "Pending",
        formatting_issues ? (typeof formatting_issues === "string" ? formatting_issues : JSON.stringify(formatting_issues)) : "[]",
        author_confirmed_formatting === true || author_confirmed_formatting === "true",
      ]
    );

    // Insert Authors
    let primaryEmail = "";
    if (typeof authors === 'string') {
      const parsed = JSON.parse(authors);
      for (const auth of parsed) {
        if (auth.is_primary) primaryEmail = auth.email;
        await pool.query(
          `INSERT INTO chapter_authors (submission_id, is_primary, name, email, phone, country, institution, address, author_bio) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [submissionId, auth.is_primary, auth.name, auth.email, auth.phone, auth.country, auth.institution, auth.address, auth.bio]
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
    if (inTransaction) {
      await pool.query("ROLLBACK").catch(() => undefined);
    }
    if (err instanceof UploadError) {
      return res.status(400).json({ error: err.message });
    }
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
            'country', a.country,
            'address', a.address,
            'author_bio', a.author_bio
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
  const { stage, payment_status } = req.body;
  
  try {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (stage) {
      updates.push(`stage = $${paramIndex++}`);
      values.push(stage);
    }
    if (payment_status) {
      updates.push(`payment_status = $${paramIndex++}`);
      values.push(payment_status);
    }
    
    updates.push(`updated_at = NOW()`);
    
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



// --- CALL FOR ABSTRACTS ---

export const getAbstractSubmissions = async (req: Request, res: Response) => {
  try {
    const list = await abstractService.getAll();
    res.json(list);
  } catch (err) {
    console.error("[AbstractController] Failed to fetch submissions:", err);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
};

export const submitAbstract = async (req: Request, res: Response) => {
  try {
    const {
      author_name,
      author_type,
      department,
      institution,
      email,
      phone,
      research_area_id,
      research_area_name,
      abstract_title,
      abstract_text,
      keywords,
      is_sole_author,
      payment_status,
      payment_ref,
    } = req.body;

    if (!author_name || !email || !abstract_title || !abstract_text) {
      return res.status(400).json({ error: "Author name, email, title, and abstract text are required." });
    }

    const manuscript = (req.files as any)?.manuscript?.[0];
    const paymentScreenshot = (req.files as any)?.payment_screenshot?.[0];

    let manuscript_url: string | null = null;
    let payment_screenshot_url: string | null = null;

    if (manuscript) {
      const saved = await saveUpload(manuscript, "manuscripts");
      manuscript_url = saved.url;
    }

    if (paymentScreenshot) {
      const saved = await saveUpload(paymentScreenshot, "payments");
      payment_screenshot_url = saved.url;
    }

    const wordCount = abstract_text.trim().split(/\s+/).filter(Boolean).length;

    const submission = await abstractService.create({
      author_name,
      author_type: author_type || "Research Scholar",
      department: department || "",
      institution: institution || "",
      email,
      phone: phone || "",
      research_area_id: research_area_id || "interdisciplinary",
      research_area_name: research_area_name || "Interdisciplinary Studies",
      abstract_title,
      abstract_text,
      word_count: wordCount,
      keywords: keywords || "",
      is_sole_author: is_sole_author === true || is_sole_author === "true",
      payment_status: (payment_status as any) || (payment_ref ? "Paid" : "Pending"),
      payment_ref: payment_ref || "",
      payment_screenshot_url,
      manuscript_url,
      review_status: "Pending Review",
    });

    if (email) {
      sendNotificationEmail({
        to: email,
        subject: `Abstract Submission Received: ${abstract_title}`,
        message: `Dear ${author_name},\n\nThank you for submitting your abstract to "Interdisciplinary Horizons 2026".\n\nSubmission ID: ${submission.id}\nTitle: ${abstract_title}\nStatus: Pending Review\nFee Status: ${submission.payment_status}\n\nAcademic Development Forum\nhttps://adf.org.in`,
      }).catch((e) => console.warn("[AbstractController] Email notification error:", e));
    }

    res.json({ success: true, submission });
  } catch (err: any) {
    if (err instanceof UploadError) {
      return res.status(400).json({ error: err.message });
    }
    console.error("[AbstractController] Submission error:", err);
    res.status(500).json({ error: "Failed to process abstract submission" });
  }
};

export const updateAbstractStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { review_status, admin_notes } = req.body;

  try {
    const updated = await abstractService.updateStatus(id, review_status, admin_notes);
    if (!updated) {
      return res.status(404).json({ error: "Submission not found" });
    }

    if (updated.email && (review_status === "Accepted" || review_status === "Revision Required")) {
      sendNotificationEmail({
        to: updated.email,
        subject: `Update on your Abstract Submission: ${updated.abstract_title}`,
        message: `Dear ${updated.author_name},\n\nYour abstract submission (${updated.id}) has been updated.\n\nNew Review Status: ${review_status}\nNotes: ${admin_notes || "No additional notes."}\n\nAcademic Development Forum`,
      }).catch((e) => console.warn("[AbstractController] Email notification error:", e));
    }

    res.json({ success: true, submission: updated });
  } catch (err) {
    console.error("[AbstractController] Status update error:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
};

export const updateAbstractPayment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { payment_status } = req.body;

  try {
    const updated = await abstractService.updatePayment(id, payment_status);
    if (!updated) {
      return res.status(404).json({ error: "Submission not found" });
    }
    res.json({ success: true, submission: updated });
  } catch (err) {
    console.error("[AbstractController] Payment update error:", err);
    res.status(500).json({ error: "Failed to update payment status" });
  }
};

export const deleteAbstractSubmission = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await abstractService.delete(id);
    res.json({ success: true });
  } catch (err) {
    console.error("[AbstractController] Delete error:", err);
    res.status(500).json({ error: "Failed to delete abstract submission" });
  }
};

export const updateAbstractAttachments = async (req: Request, res: Response) => {
  const { id } = req.params;
  const manuscript = (req.files as any)?.manuscript?.[0];
  const paymentScreenshot = (req.files as any)?.payment_screenshot?.[0];

  try {
    let manuscript_url: string | undefined = undefined;
    let payment_screenshot_url: string | undefined = undefined;

    if (manuscript) {
      const saved = await saveUpload(manuscript, "manuscripts");
      manuscript_url = saved.url;
    }

    if (paymentScreenshot) {
      const saved = await saveUpload(paymentScreenshot, "payments");
      payment_screenshot_url = saved.url;
    }

    const updated = await abstractService.updateAttachments(id, {
      manuscript_url,
      payment_screenshot_url,
    });

    if (!updated) {
      return res.status(404).json({ error: "Submission not found" });
    }

    res.json({ success: true, submission: updated });
  } catch (err: any) {
    if (err instanceof UploadError) {
      return res.status(400).json({ error: err.message });
    }
    console.error("[AbstractController] Update attachments error:", err);
    res.status(500).json({ error: "Failed to update attachments" });
  }
};
