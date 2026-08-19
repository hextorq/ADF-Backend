import { Router } from "express";
import { pool } from "../../db/pool.js";

export const filesRouter = Router();

filesRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query("SELECT * FROM files WHERE id = $1", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).send("File not found");
    }
    
    const file = result.rows[0];
    res.setHeader("Content-Type", file.mimetype);
    res.send(file.data);
  } catch (error) {
    console.error("Error fetching file:", error);
    res.status(500).send("Internal server error");
  }
});
