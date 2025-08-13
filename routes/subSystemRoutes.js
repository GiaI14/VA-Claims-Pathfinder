const express = require('express');
const router = express.Router();
const { getDb } = require('../data/database');

// Render main page with systems list loaded from DB
router.get('/sub-system', async (req, res) => {
  try {
    const db = getDb();
    // Assuming `systems` column in your DB table va_disabilities
    const [systemsRows] = await db.execute('SELECT DISTINCT systems FROM va_disabilities');
    const systemsFromServer = systemsRows.map(row => row.systems);

    res.render('subSystem', {
      csrfToken: req.csrfToken(),
      systemsFromServer,
      nonce: res.locals.nonce,
    });
  } catch (err) {
    console.error('Error fetching systems:', err);
    res.status(500).send('Error fetching systems');
  }
});

// API route: get sub-systems by system name
router.get('/api/sub-systems/:system', async (req, res) => {
  try {
    const db = getDb();
    const system = req.params.system;

    const [rows] = await db.execute(
      'SELECT DISTINCT sub_systems FROM va_disabilities WHERE systems = ?',
      [system]
    );

    const subSystems = rows.map(row => row.sub_systems);
    res.json(subSystems);
  } catch (err) {
    console.error('Error fetching sub-systems:', err);
    res.status(500).json({ error: 'Failed to fetch sub-systems' });
  }
});

// API route: get symptoms by sub-system name
router.get('/api/symptoms/:subSystem', async (req, res) => {
  try {
    const db = getDb();
    const subSystem = req.params.subSystem;

    const [rows] = await db.execute(
      'SELECT symptoms FROM va_disabilities WHERE sub_systems = ?',
      [subSystem]
    );

    let allSymptoms = [];
    rows.forEach(row => {
      if (row.symptoms) {
        allSymptoms = allSymptoms.concat(
          row.symptoms.split(',').map(s => s.trim()).filter(Boolean)
        );
      }
    });

    // Remove duplicates
    const uniqueSymptoms = [...new Set(allSymptoms)];

    res.json(uniqueSymptoms);
  } catch (err) {
    console.error('Error fetching symptoms:', err);
    res.status(500).json({ error: 'Failed to fetch symptoms' });
  }
});

module.exports = router;
