import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import pool from "../db";

const router = express.Router();

// Setup multer untuk upload gambar katalog baru
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage });

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

// POST tambah item katalog baru (dipanggil dari halaman upload admin)
router.post(
  "/catalog",
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      const { name, description, user_id } = req.body;

      let categoryArray: string[] = [];
      try {
        categoryArray = JSON.parse(req.body.category || "[]");
      } catch {
        categoryArray = [];
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Gambar wajib diupload",
        });
      }

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Judul wajib diisi",
        });
      }

      const imageUrl = "uploads/" + req.file.filename;

      const result = await pool.query(
        `INSERT INTO results (user_id, image_name, image_url, category, description)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, image_name AS name, category, description, image_url AS image`,
        [user_id || null, name, imageUrl, categoryArray, description || ""]
      );

      res.status(201).json({
        success: true,
        message: "Katalog berhasil ditambahkan",
        data: result.rows[0],
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Gagal menyimpan katalog",
      });
    }
  }
);

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