import { pool } from "../../db/pool.js";

// --- AUTHORS ---

export async function getAuthors() {
  const result = await pool.query(
    "SELECT * FROM authors ORDER BY created_at DESC"
  );
  return result.rows;
}

export async function createAuthor(data: any) {
  const result = await pool.query(
    `INSERT INTO authors (name, bio, photo_url)
     VALUES ($1, $2, $3) RETURNING *`,
    [data.name, data.bio || null, data.photo_url || null]
  );
  return result.rows[0];
}

export async function updateAuthor(id: number, data: any) {
  const result = await pool.query(
    `UPDATE authors 
     SET name = COALESCE($1, name),
         bio = COALESCE($2, bio),
         photo_url = COALESCE($3, photo_url)
     WHERE id = $4 RETURNING *`,
    [data.name, data.bio, data.photo_url, id]
  );
  return result.rows[0];
}

export async function deleteAuthor(id: number) {
  await pool.query("DELETE FROM authors WHERE id = $1", [id]);
}

// --- BOOKS ---

export async function getBooks() {
  const result = await pool.query(
    `SELECT b.*, a.name as author_name_resolved 
     FROM books b 
     LEFT JOIN authors a ON b.author_id = a.id 
     ORDER BY b.created_at DESC`
  );
  return result.rows;
}

export async function createBook(data: any) {
  const result = await pool.query(
    `INSERT INTO books (
      title, author_id, author_name, isbn, category, price, discount, 
      stock_status, cover_url, preview_url, pdf_url, is_featured, 
      is_best_seller, badge, language, pages, publisher, publication_date, description
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
    ) RETURNING *`,
    [
      data.title, data.author_id || null, data.author_name || null, data.isbn || null,
      data.category, data.price || 0, data.discount || 0, data.stock_status || 'In Stock',
      data.cover_url || null, data.preview_url || null, data.pdf_url || null,
      data.is_featured || false, data.is_best_seller || false, data.badge || null,
      data.language || 'English', data.pages || null, data.publisher || 'ADF Publications',
      data.publication_date || null, data.description || null
    ]
  );
  return result.rows[0];
}

export async function updateBook(id: number, data: any) {
  // Using a dynamic update query for convenience or a large coalesce
  const result = await pool.query(
    `UPDATE books SET 
      title = COALESCE($1, title),
      author_id = $2,
      author_name = COALESCE($3, author_name),
      isbn = COALESCE($4, isbn),
      category = COALESCE($5, category),
      price = COALESCE($6, price),
      discount = COALESCE($7, discount),
      stock_status = COALESCE($8, stock_status),
      cover_url = COALESCE($9, cover_url),
      preview_url = COALESCE($10, preview_url),
      pdf_url = COALESCE($11, pdf_url),
      is_featured = COALESCE($12, is_featured),
      is_best_seller = COALESCE($13, is_best_seller),
      badge = COALESCE($14, badge),
      language = COALESCE($15, language),
      pages = COALESCE($16, pages),
      publisher = COALESCE($17, publisher),
      publication_date = COALESCE($18, publication_date),
      description = COALESCE($19, description)
    WHERE id = $20 RETURNING *`,
    [
      data.title, data.author_id, data.author_name, data.isbn,
      data.category, data.price, data.discount, data.stock_status,
      data.cover_url, data.preview_url, data.pdf_url,
      data.is_featured, data.is_best_seller, data.badge,
      data.language, data.pages, data.publisher,
      data.publication_date, data.description, id
    ]
  );
  return result.rows[0];
}

export async function deleteBook(id: number) {
  await pool.query("DELETE FROM books WHERE id = $1", [id]);
}

// --- ORDERS ---

export async function getOrders() {
  const result = await pool.query(
    "SELECT * FROM orders ORDER BY created_at DESC"
  );
  return result.rows;
}

export async function updateOrderStatus(id: number, status: string) {
  const result = await pool.query(
    "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
    [status, id]
  );
  return result.rows[0];
}
