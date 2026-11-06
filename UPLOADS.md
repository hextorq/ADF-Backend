# File uploads

All uploaded files live on the server disk under `backend/uploads/<folder>/`.
The database only ever stores the returned path (for example
`/uploads/chapters/my-chapter-1762266000000-a1b2c3d4.docx`). No file bytes are
written to Postgres anymore.

## Layout

```
backend/
  uploads/
    manuscripts/     public  author manuscripts (literary + chapter)
    chapters/        public  chapter submissions
    covers/          public  literary cover images
    author-photos/   public  author portraits
    payments/        public  payment screenshots
    publications/   public   chapter volume covers + volume PDFs
    books/          public   bookstore covers
    authors/        public   bookstore author photos
    cms/            public   inline CMS images (header/footer logo)
    templates/      public   formatter master templates (.docx)
    misc/           public   anything unclassified
    formatted/      server   generated formatted .docx (never uploadable)
```

> **Current state:** every uploadable folder is public (no admin token). This is
> controlled only by the `public` flag per folder in `src/lib/uploads.ts` — set
> it back to `false` to re-lock a folder. `formatted/` is never exposed.

`UPLOADS_DIR` in `.env` can move the whole tree somewhere else (for example a
mounted volume). Default: `backend/uploads`.

## Upload API

```
POST /api/uploads/:folder
Content-Type: multipart/form-data
body: one file in any field (the API takes the first file)
Authorization: Bearer <admin token>   (only for non-public folders)
```

Response `201`:

```json
{
  "url": "/uploads/books/cover-1762266000000-a1b2c3d4.png",
  "path": "uploads/books/cover-1762266000000-a1b2c3d4.png",
  "folder": "books",
  "filename": "cover-1762266000000-a1b2c3d4.png",
  "size": 48213,
  "mimetype": "image/png"
}
```

Store `url` in Postgres. Example:

```ts
const { url } = await uploadFile(coverFile, "books");
await apiFetch("/bookstore/books", { body: JSON.stringify({ cover_url: url }) });
```

Rules:

- the folder decides the destination, the allowed extensions and the size cap
- unknown folders return `404`
- all folders are public right now; a folder becomes admin-only by setting
  `public: false` in `src/lib/uploads.ts`
- `GET /api/uploads/` lists the folders and their rules

## Serving

```
GET /uploads/<folder>/<file>     express.static(UPLOADS_ROOT)
```

Files are served with `X-Content-Type-Options: nosniff` and a restrictive CSP,
and can be cached for 30 days because the generated names are unique.

## Legacy blobs (removed)

Files uploaded before the disk-storage change lived in the `files` table and
were served by `GET /api/files/:id`. They were exported to `uploads/<folder>/`,
every stored reference was rewritten to `/uploads/...`, and migration
`012_drop_legacy_files.sql` drops the table. That route has been removed too,
so `/api/files/:id` now returns the normal JSON 404.
