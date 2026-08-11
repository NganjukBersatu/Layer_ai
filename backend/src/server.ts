import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import pool from "./db";
import splitImageRouter from "./routes/splitImage.route";
import { removeBackground } from "@imgly/background-removal-node";

dotenv.config();

const app = express();

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

// Middleware
app.use(cors());
app.use(express.json());

// Serve folder uploads secara statis, supaya gambar bisa diakses lewat
// http://localhost:3000/uploads/namafile.jpg
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Route untuk split image (FAL.ai)
app.use("/", splitImageRouter);

app.get("/test-db", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      success: true,
      time: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Gagal terhubung ke database",
    });
  }
});

app.get("/", (req: Request, res: Response) => {
  res.send("Backend AI Layer Splitter berjalan");
});

app.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND password = $2",
      [email, password]
    );

    if (result.rows.length > 0) {
      res.json({
        success: true,
        message: "Login berhasil",
        user: result.rows[0],
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
});

app.post("/save-result", async (req: Request, res: Response) => {
  try {
    const { user_id, image_name, image_url, model } = req.body;

    const result = await pool.query(
      `INSERT INTO results (user_id, image_name, image_url, model)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, image_name, image_url, model || "basic"]
    );

    res.json({
      success: true,
      message: "Hasil berhasil disimpan",
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Gagal menyimpan hasil",
    });
  }
});

app.get("/history/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT *
       FROM results
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil history",
    });
  }
});

// Hapus satu history berdasarkan id, sekaligus hapus file gambarnya di disk
app.delete("/history/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM results WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data tidak ditemukan",
      });
    }

    const deletedItem = result.rows[0];

    // image_url tersimpan seperti "uploads/xxx.jpg"
    const filePath = path.join(__dirname, "..", deletedItem.image_url);

    fs.unlink(filePath, (err) => {
      if (err) {
        console.warn("File tidak ditemukan atau gagal dihapus:", filePath);
      }
    });

    res.json({
      success: true,
      message: "History berhasil dihapus",
      data: deletedItem,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus data",
    });
  }
});

app.post("/add-credit", async (req: Request, res: Response) => {
  try {
    const { user_id, amount } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET credit = credit + $1
       WHERE id = $2
       RETURNING credit`,
      [amount, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    res.json({
      success: true,
      credit: result.rows[0].credit,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Gagal menambah credit",
    });
  }
});

app.get("/user-credit", async (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;

    const result = await pool.query(
      "SELECT credit FROM users WHERE id = $1",
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    res.json({
      success: true,
      credit: result.rows[0].credit,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil sisa credit",
    });
  }
});

app.post("/deduct-credit", async (req: Request, res: Response) => {
  try {
    const { user_id, amount } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET credit = credit - $1
       WHERE id = $2 AND credit >= $1
       RETURNING credit`,
      [amount, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Credit tidak cukup",
      });
    }

    res.json({
      success: true,
      remaining_credit: result.rows[0].credit,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Gagal mengurangi credit",
    });
  }
});

app.post(
  "/upload-image",
  upload.single("image"),
  (req: Request, res: Response) => {
    try {
      // req.file bisa undefined kalau tidak ada file yang dikirim,
      // TypeScript wajib kita cek ini dulu sebelum diakses.
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Tidak ada file yang diupload",
        });
      }

      res.json({
        success: true,
        filename: req.file.filename,
        path: "uploads/" + req.file.filename,
      });
     } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Upload gagal",
      });
    }
  }
);

app.post(
  "/remove-background",
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Tidak ada file gambar",
        });
      }

      console.log("📁 File diterima:", req.file.originalname);

      console.log("🤖 Memulai background removal...");

      const result = await removeBackground(req.file.path);

      const outputFilename =
        `layer-${Date.now()}.png`;

      const outputPath = path.join(
        "uploads",
        outputFilename
      );

      const buffer = Buffer.from(
        await result.arrayBuffer()
      );

      fs.writeFileSync(outputPath, buffer);

      console.log(
        "✅ Background berhasil dihapus"
      );

      console.log(
        "💾 Hasil disimpan:",
        outputPath
      );

      // Hapus file original sementara
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.warn(
            "⚠️ Gagal menghapus file sementara:",
            err.message
          );
        }
      });

      res.json({
        success: true,
        message: "Background berhasil dihapus",
        result: `/uploads/${outputFilename}`,
      });
    } catch (error) {
      console.error(
        "❌ Background removal gagal:",
        error
      );

      if (
        req.file?.path &&
        fs.existsSync(req.file.path)
      ) {
        fs.unlink(req.file.path, () => {});
      }

      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }
);

// Jalankan server
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});