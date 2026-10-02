import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import { initDb, query } from "./db.js";
import { authRequired, publicUser } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import catalogRoutes from "./routes/catalog.js";
import submissionRoutes from "./routes/submissions.js";
import marketRoutes from "./routes/market.js";
import favoriteRoutes from "./routes/favorites.js";
import dashboardRoutes from "./routes/dashboard.js";
import { refreshAllReferencePrices } from "./services/priceIndex.js";
import { seedIfEmpty } from "./seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "../uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || ".jpg") || ".jpg";
    cb(null, `user-${req.user.id}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 3 * 1024 * 1024 } });

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadDir));

app.get("/api/health", (_req, res) => res.json({ ok: true, name: "Geberewu Market" }));
app.use("/api/auth", authRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.post("/api/auth/avatar", authRequired, upload.single("photo"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Choose a photo." });
  const url = `/uploads/${req.file.filename}`;
  const { rows } = await query(
    `UPDATE users SET profile_pic = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, full_name, email, phone, role, city, profile_pic, created_at`,
    [url, req.user.id]
  );
  res.json({ user: publicUser(rows[0], { includePasswordHint: true }) });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Server error" });
});

const port = Number(process.env.PORT || 4000);

initDb()
  .then(() => refreshAllReferencePrices(query).catch((err) => console.warn("Price index refresh:", err.message)))
  .then(() => seedIfEmpty())
  .then(() => {
    app.listen(port, () => console.log(`Geberewu Market API on http://localhost:${port}`));
  })
  .catch((err) => {
    console.error("Failed to start:", err);
    process.exit(1);
  });
