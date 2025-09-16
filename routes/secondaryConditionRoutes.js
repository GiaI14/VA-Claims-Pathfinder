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

router.post('/secondary-conditions/save', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false, message: 'Not authenticated' });

  const { results } = req.body; 
  if (!results || results.length === 0) {
    return res.status(400).json({ success: false, message: 'No secondary conditions provided.' });
  }

  const userId = req.session.user.id || null;
  const googleUserId = req.session.user.google_id || null;

   console.log('Saving secondary conditions:', { userId, googleUserId, results });
  
  try {
    const db = getDb();
    await db.execute(
      `INSERT INTO saved_secondary (user_id, google_user_id, results_json, created_at)
       VALUES (?, ?, ?, NOW())`,
      [userId, googleUserId, JSON.stringify(results)]
    );

    res.json({ success: true, message: 'Secondary conditions saved successfully.' });
  } catch (err) {
    console.error('Error saving secondary conditions:', err);
    res.status(500).json({ success: false, message: 'Database error: ' + err.message });
  }
});

/////////////////NEED TO DELETE////////////////////////////////////////////////////////////////////////
router.get('/saved-secondary', async (req, res) => {
  if (!req.session.user) return res.status(401).json([]);

  const userId = req.session.user.id;
  const googleUserId = req.session.user.google_id;

  try {
    const db = getDb();
    let query = `SELECT id, results_json, created_at FROM saved_secondary WHERE `;
    const params = [];

    if (userId && googleUserId) {
      query += `user_id = ? OR google_user_id = ? `;
      params.push(userId, googleUserId);
    } else if (userId) {
      query += `user_id = ? `;
      params.push(userId);
    } else if (googleUserId) {
      query += `google_user_id = ? `;
      params.push(googleUserId);
    } else {
      return res.json([]); // No valid user identifiers
    }

    query += `ORDER BY created_at DESC`;

    const [rows] = await db.execute(query, params);

    const parsed = rows.map(r => ({
      id: r.id,
      created_at: r.created_at,
      results: typeof r.results_json === 'string' ? JSON.parse(r.results_json) : r.results_json
    }));

    res.json(parsed);
  } catch (err) {
    console.error('Error fetching saved secondary results:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/delete-saved-secondary/:id', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false, message: 'Not authenticated' });

  const id = req.params.id;
  const userId = req.session.user.id;
  const googleUserId = req.session.user.google_id;

  try {
    const db = getDb();
    
    // Delete only if the saved row belongs to this user
    const [result] = await db.execute(
      `DELETE FROM saved_secondary 
       WHERE id = ? AND (user_id = ? OR google_user_id = ?)`,
      [id, userId, googleUserId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Saved secondary condition not found' });
    }

    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    console.error('Error deleting saved secondary condition:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});



module.exports = router;
