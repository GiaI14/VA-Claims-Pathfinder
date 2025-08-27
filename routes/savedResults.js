const express = require('express');
const router = express.Router();
const { getDb } = require('../data/database');

// Save results
router.post('/save-results', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false });

  const { results } = req.body;
  const userId = req.session.user.id;
  const googleUserId = req.session.user.google_id || null;

  if (!results) return res.status(400).json({ success: false });

  try {
    const db = getDb();
    await db.execute(
      'INSERT INTO saved_results (user_id, google_user_id, results_json, created_at) VALUES (?, ?, ?, NOW())',
      [userId, googleUserId, JSON.stringify(results)]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving results:', err);
    res.json({ success: false });
  }
});

// Get saved results
router.get('/get-saved-results', async (req, res) => {
  if (!req.session.user) return res.status(401).json([]);

  const userId = req.session.user.id;
  const googleUserId = req.session.user.google_id || null;

  try {
    const db = getDb();
    const [rows] = await db.execute(
      'SELECT results_json, created_at FROM saved_results WHERE user_id = ? OR google_user_id = ? ORDER BY created_at DESC',
      [userId, googleUserId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching saved results:', err);
    res.json([]);
  }
});

module.exports = router;
