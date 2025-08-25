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

module.exports = router;
