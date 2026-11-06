-- 012_drop_legacy_files.sql
--
-- New uploads are written to disk under uploads/<folder>/ and only the path is
-- stored in the business tables. The pre-existing blobs were exported to disk
-- and every stored /api/files/<id> reference was rewritten to /uploads/... .
-- The /api/files/:id compatibility route has been removed, so nothing reads or
-- writes the legacy blob table anymore.

DROP TABLE IF EXISTS files;