const express = require('express');
const router = express.Router();
const { getDb } = require('../data/database'); // adjust path if needed

// Save results
router.post('/save-results', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false });

  const userId = req.session.user.id;
  const { results } = req.body;

  try {
    const db = getDb();
    await db.execute(
      'INSERT INTO saved_results (user_id, results_json, created_at) VALUES (?, ?, NOW())',
      [userId, JSON.stringify(results)]
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

  try {
    const db = getDb();
    const [rows] = await db.execute(
      'SELECT results_json, created_at FROM saved_results WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching saved results:', err);
    res.json([]);
  }
});

module.exports = router;
