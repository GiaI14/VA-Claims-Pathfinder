const express = require('express');
const { getDb } = require('../data/database'); // Import getDb
const router = express.Router();

// Route to fetch secondary conditions
router.post('/secondary-conditions', async (req, res) => {
  const disabilities = req.body.disabilities;
  console.log('Received disabilities:', disabilities); // Debugging log

  if (disabilities && disabilities.length > 0) {
    try {
      // Build dynamic WHERE with LOWER + LIKE
      const conditions = disabilities.map(() => 'LOWER(condition_name) LIKE ?').join(' OR ');
      const query = `
        SELECT condition_name, secondary_conditions
        FROM va_disabilities
        WHERE ${conditions}
      `;

      // Prepare params (all lowercase for safety)
      const params = disabilities.map(d => `%${d.toLowerCase()}%`);

      console.log('Executing query:', query); // Debugging log
      console.log('With parameters:', params); // Debugging log

      const [rows] = await getDb().query(query, params);
      console.log('Query results:', rows); // Debugging log

      res.json({ 
        message: 'Secondary conditions fetched successfully.', 
        secondaryConditions: rows 
      });
    } catch (err) {
      console.error('Error fetching secondary conditions:', err);
      res.status(500).json({ message: 'An error occurred while fetching secondary conditions.' });
    }
  } else {
    console.log('No disabilities data provided.'); // Debugging log
    res.status(400).json({ message: 'No disabilities data provided.' });
  }
});

router.get('/saved-secondary', async (req, res) => {
  if (!req.session.user) return res.status(401).json([]);

  const userId = req.session.user.id || null;
  const googleUserId = req.session.user.google_id || null;

  try {
    const db = getDb();
    const [rows] = await db.execute(
      `SELECT id, results_json, created_at
       FROM saved_results
       WHERE (user_id = ? OR google_user_id = ?) AND results_json IS NOT NULL
       ORDER BY created_at DESC`,
      [userId, googleUserId]
    );

    // Only return results that look like secondary conditions
    const parsed = rows
      .map(r => {
        let resultsData;
        try {
          resultsData = typeof r.results_json === 'string' ? JSON.parse(r.results_json) : r.results_json;
        } catch (e) {
          console.error('Error parsing JSON for saved result id', r.id);
          resultsData = [];
        }

        // Check if the result looks like secondary conditions (array of objects with "disability" key)
        if (Array.isArray(resultsData) && resultsData.length > 0 && resultsData[0].disability) {
          return {
            id: r.id,
            created_at: r.created_at,
            results: resultsData
          };
        } else {
          return null;
        }
      })
      .filter(r => r !== null);

    res.json(parsed);
  } catch (err) {
    console.error('Error fetching saved secondary results:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;
