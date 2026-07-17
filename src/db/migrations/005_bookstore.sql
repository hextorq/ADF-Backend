-- Bookstore Module Schemas

CREATE TABLE IF NOT EXISTS authors (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author_id BIGINT REFERENCES authors(id) ON DELETE SET NULL,
  author_name TEXT, -- Denormalized for quick search if author_id is null
  isbn TEXT,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount INTEGER DEFAULT 0,
  stock_status TEXT DEFAULT 'In Stock',
  cover_url TEXT,
  preview_url TEXT,
  pdf_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_best_seller BOOLEAN DEFAULT false,
  badge TEXT,
  language TEXT DEFAULT 'English',
  pages INTEGER,
  publisher TEXT DEFAULT 'ADF Publications',
  publication_date DATE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_intent_id TEXT,
  shipping_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  book_id BIGINT REFERENCES books(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_purchase DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS book_reviews (
  id BIGSERIAL PRIMARY KEY,
  book_id BIGINT REFERENCES books(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  status TEXT DEFAULT 'pending_approval',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
