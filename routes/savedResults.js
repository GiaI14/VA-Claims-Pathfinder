const express = require('express');
const router = express.Router();
const { getDb } = require('../data/database');

// Save results
// Save results
router.post('/save-results', async (req, res) => {
  const { results } = req.body;
  if (!results) {
    return res.status(400).json({ success: false, message: 'No results provided' });
  }

  // If not logged in → stash results in session
  if (!req.session.user) {
    req.session.tempResults = results;
    await req.session.save();
    return res.status(200).json({ success: true, message: 'Results stored in session (guest)' });
  }

  // If logged in → save to DB as usual
  let userId = null;
  let googleUserId = null;

  if (req.session.user.google_id) {  
    googleUserId = req.session.user.id; 
  } else {                            
    userId = req.session.user.id;     
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
router.get('/get-saved-results', async (req, res) => {
  if (!req.session.user) return res.status(401).json([]);

  const userId = req.session.user.user.id || null;
  const googleUserId = req.session.user.google_user_id || null;

  try {
    const db = getDb();
    const [rows] = await db.execute(
      'SELECT results_json, created_at FROM saved_results WHERE user_id = ? OR google_user_id = ? ORDER BY created_at DESC',
      [userId, googleUserId]
    );

    const parsed = rows.map(r => ({
      created_at: r.created_at,
      results_json: JSON.parse(r.results_json)
    })); 
    res.json(parsed);
  } catch (err) {
    console.error('Error fetching saved results:', err);
    res.status(500).json({ success: false, message: 'Database error: ' + err.message});
  }
});

module.exports = router;   // 👈 important
