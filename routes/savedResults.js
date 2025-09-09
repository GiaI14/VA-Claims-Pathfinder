const express = require('express');
const router = express.Router();
const { getDb } = require('../data/database');

// Save results
router.post('/save-results', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const { results } = req.body;
  if (!results) {
    return res.status(400).json({ success: false, message: 'No results provided' });
  }

  // Determine which ID to use
  let userId = null;
  let googleUserId = null;

  if (req.session.user.google_id) {  // Google login
    googleUserId = req.session.user.id; // numeric ID
  } else {                            // normal registered user
    userId = req.session.user.id;      // numeric ID
  }

  try {
    const db = getDb();
    await db.execute(
      'INSERT INTO saved_results (user_id, google_user_id, results_json, created_at) VALUES (?, ?, ?, NOW())',
      [userId, googleUserId, JSON.stringify(results)]
    );

    res.status(200).json({ success: true, message: 'Results saved successfully' });
  } catch (err) {
    console.error('Error saving results:', err);
    res.status(500).json({ success: false, message: 'Database error: ' + err.message });
  }
});

// Get saved results
// Get saved results
router.get('/get-saved-results', async (req, res) => {
  if (!req.session.user) return res.status(401).json([]);

  const userId = req.session.user.id || null;
  const googleUserId = req.session.user.google_id || null;

  try {
    const db = getDb();
    const [rows] = await db.execute(
      `SELECT id, results_json, created_at 
       FROM saved_results 
       WHERE user_id = ? OR google_user_id = ? 
       ORDER BY created_at DESC`,
      [userId, googleUserId]
    );

    const parsed = rows.map(r => ({
      id: r.id, // include id here
      created_at: r.created_at,
      results_json: (typeof r.results_json === 'string')
        ? JSON.parse(r.results_json)
        : r.results_json
    }));

    res.json(parsed);
  } catch (err) {
    console.error('Error fetching saved results:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Database error: ' + err.message 
    });
  }
});


// DELETE a saved result by ID
router.delete('/delete-saved-result/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.session?.user?.id; // adjust based on your auth

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Ensure user can only delete their own results
    await db.query('DELETE FROM saved_results WHERE id = ? AND user_id = ?', [id, userId]);

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting saved result:', err);
    res.status(500).json({ error: 'Failed to delete result' });
  }
});

module.exports = router;  
