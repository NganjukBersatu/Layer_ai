import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import pool from "../db";

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/auth/google", async (req, res) => {
  const { credential } = req.body; // ID token dari frontend

  if (!credential) {
    return res.status(400).json({ success: false, message: "Token tidak ditemukan" });
  }

  try {
    // Verifikasi token LANGSUNG ke Google — jangan percaya data dari frontend
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(401).json({ success: false, message: "Token tidak valid" });
    }

    const { sub: googleId, email, name, picture } = payload;

    // Cek apakah user sudah ada (berdasarkan google_id atau email)
    const existing = await pool.query(
      "SELECT * FROM users WHERE google_id = $1 OR email = $2",
      [googleId, email]
    );

    let user;

    if (existing.rows.length > 0) {
      user = existing.rows[0];

      // Proteksi: kalau akun ini admin dan belum pernah ditautkan ke Google,
      // tolak — admin wajib login manual saja.
      if (user.is_admin && !user.google_id) {
        return res.status(403).json({
          success: false,
          message: "Akun admin tidak bisa login lewat Google. Silakan login manual.",
        });
      }

      const updated = await pool.query(
        "UPDATE users SET google_id = $1, avatar_url = $2 WHERE id = $3 RETURNING *",
        [googleId, picture, user.id]
      );
      user = updated.rows[0];
    } else {
      // User baru dari Google
      const inserted = await pool.query(
        `INSERT INTO users (name, email, google_id, is_admin, avatar_url)
         VALUES ($1, $2, $3, false, $4) RETURNING *`,
        [name, email, googleId, picture]
      );
      user = inserted.rows[0];
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin,
        avatar_url: user.avatar_url,
      },
    });
  } catch (err) {
    console.error("Google auth error:", err);
    return res.status(401).json({ success: false, message: "Verifikasi Google gagal" });
  }
});

export default router;