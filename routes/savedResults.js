const express = require('express');
const router = express.Router();
const { getDb } = require('../data/database');

// Save results
app.post('/save-results', async (req, res) => {
  console.log('Incoming /save-results request');  // 👈 should fire every time
  console.log('Session user:', req.session?.user || req.session?.googleUser);
  console.log('Results from client:', req.body);

  try {
    const user = req.session.user || req.session.googleUser;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const db = getDb();
    await db.execute(
      'INSERT INTO saved_results (user_id, results_json) VALUES (?, ?)',
      [user.id, JSON.stringify(req.body.results)]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error saving results:', err);
    res.status(500).json({ error: 'Internal Server Error' });
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
