import { Router } from "express";
import { query } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.post("/:targetId", authRequired, async (req, res) => {
  const targetId = Number(req.params.targetId);
  if (targetId === req.user.id) return res.status(400).json({ error: "You cannot star yourself." });
  const { rows } = await query(`SELECT id, role FROM users WHERE id = $1`, [targetId]);
  if (!rows[0]) return res.status(404).json({ error: "User not found." });
  if (rows[0].role === req.user.role) {
    return res.status(400).json({ error: "You can only star the opposite role." });
  }

  const existing = await query(
    `SELECT id FROM favorites WHERE user_id = $1 AND target_user_id = $2`,
    [req.user.id, targetId]
  );
  if (existing.rows[0]) {
    await query(`DELETE FROM favorites WHERE id = $1`, [existing.rows[0].id]);
    return res.json({ starred: false });
  }
  await query(`INSERT INTO favorites (user_id, target_user_id) VALUES ($1, $2)`, [req.user.id, targetId]);
  res.json({ starred: true });
});

export default router;
