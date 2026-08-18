import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import pool from "../db";

const router = express.Router();

// GET semua item katalog
router.get("/catalog", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, image_name AS name, category, description, image_url AS image
       FROM results
       ORDER BY created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Gagal mengambil data katalog" });
  }
});

// GET satu item katalog
router.get("/catalog/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, image_name AS name, category, description, image_url AS image
       FROM results WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Item tidak ditemukan" });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Gagal mengambil item" });
  }
});

// UPDATE item katalog (dipanggil tombol Upload di halaman detail)
router.put("/catalog/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, category, description } = req.body;

    const result = await pool.query(
      `UPDATE results
       SET image_name = $1, category = $2, description = $3
       WHERE id = $4
       RETURNING id, image_name AS name, category, description, image_url AS image`,
      [name, category, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Item tidak ditemukan" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Gagal mengupdate item" });
  }
});

// DELETE item katalog (dipanggil tombol Hapus)
router.delete("/catalog/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM results WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Item tidak ditemukan" });
    }

    const deletedItem = result.rows[0];
    const filePath = path.join(__dirname, "..", "..", deletedItem.image_url);

    fs.unlink(filePath, (err) => {
      if (err) console.warn("File tidak ditemukan atau gagal dihapus:", filePath);
    });

    res.json({ success: true, message: "Item berhasil dihapus", data: deletedItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Gagal menghapus item" });
  }
});

export default router;