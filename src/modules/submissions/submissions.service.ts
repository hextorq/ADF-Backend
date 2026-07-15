import { pool } from "../../db/pool.js";
import { CreateSubmissionDto, UpdateSubmissionStatusDto } from "./submissions.schema.js";

function generateSubmissionId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SUB-${timestamp}-${random}`;
}

export const submissionService = {
  async getPackages() {
    const result = await pool.query('SELECT * FROM literary_packages WHERE is_active = true ORDER BY price ASC');
    return result.rows.map(row => ({
      ...row,
      features: JSON.parse(row.features)
    }));
  },

  async createSubmission(
    data: CreateSubmissionDto,
    files: { manuscriptUrl: string; coverUrl?: string; authorPhotoUrl?: string }
  ) {
    const submissionId = generateSubmissionId();

    const query = `
      INSERT INTO literary_submissions (
        id, author_name, author_email, author_phone, author_country, author_address, author_bio, author_photo_url,
        book_title, book_subtitle, book_genre, book_language, word_count, page_count, synopsis, keywords,
        manuscript_url, cover_url, package_id, 
        agreed_original, agreed_copyright, agreed_not_published, agreed_policies
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19,
        $20, $21, $22, $23
      ) RETURNING id, status, payment_status, package_id;
    `;

    const values = [
      submissionId, data.authorName, data.authorEmail, data.authorPhone, data.authorCountry, data.authorAddress, data.authorBio || null, files.authorPhotoUrl || null,
      data.bookTitle, data.bookSubtitle || null, data.bookGenre, data.bookLanguage, data.wordCount, data.pageCount || null, data.synopsis, data.keywords || null,
      files.manuscriptUrl, files.coverUrl || null, data.packageId,
      data.agreedOriginal, data.agreedCopyright, data.agreedNotPublished, data.agreedPolicies
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async getSubmissionById(id: string) {
    const query = `
      SELECT s.*, p.name as package_name, p.price as package_price
      FROM literary_submissions s
      LEFT JOIN literary_packages p ON s.package_id = p.id
      WHERE s.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  async processMockPayment(id: string) {
    // Simulate a successful payment
    const transactionId = `TXN-${Date.now()}`;
    const query = `
      UPDATE literary_submissions
      SET payment_status = 'Paid', transaction_id = $2, status = 'Payment Verified'
      WHERE id = $1
      RETURNING id, payment_status, transaction_id, status;
    `;
    const result = await pool.query(query, [id, transactionId]);
    return result.rows[0];
  },

  async getAllSubmissions() {
    const query = `
      SELECT s.*, p.name as package_name 
      FROM literary_submissions s
      LEFT JOIN literary_packages p ON s.package_id = p.id
      ORDER BY s.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  async updateStatus(id: string, data: UpdateSubmissionStatusDto) {
    const query = `
      UPDATE literary_submissions
      SET status = $2
      WHERE id = $1
      RETURNING *;
    `;
    const result = await pool.query(query, [id, data.status]);
    return result.rows[0];
  }
};
