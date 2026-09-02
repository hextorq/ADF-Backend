import { Request, Response } from "express";
import path from "path";
import crypto from "crypto";
import { pool } from "../../db/pool.js";
import { saveFileToDB, saveBufferToDB } from "../../db/fileStorage.js";
import { processManuscript, DEFAULT_CONFIG, FormattingConfig } from "./formatter.engine.js";

export const formatterController = {
  /**
   * Processes an uploaded manuscript DOCX file according to active ADF rules.
   */
  async process(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No manuscript file uploaded" });
      }

      const originalFilename = req.file.originalname;
      const ext = path.extname(originalFilename).toLowerCase();
      if (ext !== ".docx" && ext !== ".doc") {
        return res.status(400).json({
          error: "Invalid file type. The ADF Manuscript Formatter requires a Microsoft Word (.docx) document.",
        });
      }

      // 1. Fetch active formatting configuration from database
      let activeConfig: FormattingConfig = DEFAULT_CONFIG;
      try {
        const configRes = await pool.query(
          "SELECT * FROM formatting_configurations WHERE is_active = true ORDER BY id DESC LIMIT 1"
        );
        if (configRes.rows.length > 0) {
          const row = configRes.rows[0];
          activeConfig = {
            version: row.version,
            name: row.name,
            generalSettings: row.general_settings,
            typographySettings: row.typography_settings,
            structureSettings: row.structure_settings,
          };
        }
      } catch (dbErr) {
        console.warn("Could not query formatting_configurations, using default:", dbErr);
      }

      // 2. Execute document parser and formatting engine
      const result = await processManuscript(req.file.buffer, originalFilename, activeConfig);

      // 3. Save original file to database storage
      const originalFileUrl = await saveFileToDB(req.file);

      // 4. Save formatted DOCX file to database storage
      const rawName = path.parse(originalFilename).name;
      const formattedFilename = `${rawName}-ADF-Formatted.docx`;
      const formattedFileUrl = await saveBufferToDB(
        result.formattedBuffer,
        formattedFilename,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "formatted-manuscript"
      );

      // 5. Create formatting session record
      const sessionId = `ADF-FMT-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      try {
        await pool.query(
          `INSERT INTO manuscript_formatting_sessions (
            id, original_filename, original_file_url, formatted_file_url, formatting_version,
            detected_structure, formatting_changes, formatting_issues, stats
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            sessionId,
            originalFilename,
            originalFileUrl,
            formattedFileUrl,
            result.formattingVersion,
            JSON.stringify(result.detectedStructure),
            JSON.stringify(result.formattingChanges),
            JSON.stringify(result.issues),
            JSON.stringify(result.stats),
          ]
        );
      } catch (sessionErr) {
        console.error("Error saving formatting session to DB:", sessionErr);
      }

      // 6. Return response to frontend
      return res.status(200).json({
        sessionId,
        originalFilename,
        originalFileUrl,
        formattedFilename,
        formattedFileUrl,
        formattingVersion: result.formattingVersion,
        stats: result.stats,
        detectedStructure: result.detectedStructure,
        formattingChanges: result.formattingChanges,
        contentChanges: 0,
        issues: result.issues,
        originalHtml: result.originalHtml,
        formattedHtml: result.formattedHtml,
      });
    } catch (error: any) {
      console.error("Error in formatterController.process:", error);
      return res.status(500).json({
        error: "Failed to process manuscript. " + (error.message || "Unknown error"),
      });
    }
  },

  /**
   * Retrieves all formatting configurations and the active rule set.
   */
  async getConfig(req: Request, res: Response) {
    try {
      const result = await pool.query(
        "SELECT * FROM formatting_configurations ORDER BY id ASC"
      );
      return res.json({
        configurations: result.rows,
        active: result.rows.find((r) => r.is_active) || result.rows[0] || DEFAULT_CONFIG,
      });
    } catch (error) {
      console.error("Error in formatterController.getConfig:", error);
      return res.status(500).json({ error: "Failed to fetch formatting configuration" });
    }
  },

  /**
   * Updates an existing configuration or creates a new version.
   */
  async updateConfig(req: Request, res: Response) {
    try {
      const {
        version,
        name,
        isActive,
        generalSettings,
        typographySettings,
        structureSettings,
        tableSettings,
        figureSettings,
        referenceSettings,
      } = req.body;

      if (!version || !name) {
        return res.status(400).json({ error: "Version string and name are required" });
      }

      if (isActive) {
        // Deactivate all other configurations
        await pool.query("UPDATE formatting_configurations SET is_active = false");
      }

      const upsertQuery = `
        INSERT INTO formatting_configurations (
          version, name, is_active, general_settings, typography_settings,
          structure_settings, table_settings, figure_settings, reference_settings, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
        ON CONFLICT (version) DO UPDATE SET
          name = EXCLUDED.name,
          is_active = EXCLUDED.is_active,
          general_settings = EXCLUDED.general_settings,
          typography_settings = EXCLUDED.typography_settings,
          structure_settings = EXCLUDED.structure_settings,
          table_settings = EXCLUDED.table_settings,
          figure_settings = EXCLUDED.figure_settings,
          reference_settings = EXCLUDED.reference_settings,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *;
      `;

      const result = await pool.query(upsertQuery, [
        version,
        name,
        isActive ?? true,
        JSON.stringify(generalSettings || {}),
        JSON.stringify(typographySettings || {}),
        JSON.stringify(structureSettings || {}),
        JSON.stringify(tableSettings || {}),
        JSON.stringify(figureSettings || {}),
        JSON.stringify(referenceSettings || {}),
      ]);

      return res.json({ success: true, configuration: result.rows[0] });
    } catch (error: any) {
      console.error("Error in formatterController.updateConfig:", error);
      return res.status(500).json({ error: "Failed to update configuration: " + error.message });
    }
  },

  /**
   * Retrieves submissions that have undergone manuscript formatting for the Admin Audit view.
   */
  async getSubmissions(req: Request, res: Response) {
    try {
      // Gather submissions with formatting info from chapters and sessions
      const chapterQuery = `
        SELECT 
          cs.id as submission_id,
          cs.chapter_title as title,
          ca.name as author_name,
          'Chapter' as submission_type,
          cs.manuscript_url as original_url,
          cs.formatted_manuscript_url as formatted_url,
          COALESCE(cs.formatting_version, 'ADF Format v1.0') as formatting_version,
          COALESCE(cs.formatting_status, 'Completed') as formatting_status,
          COALESCE(cs.author_confirmed_formatting, true) as author_confirmed,
          COALESCE(cs.formatting_issues, '[]'::jsonb) as issues,
          cs.created_at
        FROM chapter_submissions cs
        LEFT JOIN chapter_authors ca ON cs.id = ca.submission_id AND ca.is_primary = true
        ORDER BY cs.created_at DESC
        LIMIT 50;
      `;

      const sessionQuery = `
        SELECT 
          id as submission_id,
          original_filename as title,
          'Author' as author_name,
          'Direct Formatting' as submission_type,
          original_file_url as original_url,
          formatted_file_url as formatted_url,
          formatting_version,
          status as formatting_status,
          author_confirmed,
          formatting_issues as issues,
          created_at
        FROM manuscript_formatting_sessions
        ORDER BY created_at DESC
        LIMIT 50;
      `;

      const [chapterRes, sessionRes] = await Promise.all([
        pool.query(chapterQuery),
        pool.query(sessionQuery),
      ]);

      const combined = [...chapterRes.rows, ...sessionRes.rows].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return res.json({ submissions: combined });
    } catch (error) {
      console.error("Error in formatterController.getSubmissions:", error);
      return res.status(500).json({ error: "Failed to fetch formatted submissions audit" });
    }
  },
};
