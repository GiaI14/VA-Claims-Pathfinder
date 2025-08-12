const express = require('express');
const router = express.Router();
const { getDb } = require('../data/database');

// Render sub-system page with systems list
router.get('/sub-system', async (req, res) => {
  try {
    const db = getDb();
    const [systemsRows] = await db.execute('SELECT DISTINCT systems FROM va_disabilities');
    const systemsFromServer = systemsRows.map(row => row.systems);

    res.render('subSystem', {
      csrfToken: req.csrfToken(),
      nonce: res.locals.nonce,
      systemsFromServer,
    });
  } catch (err) {
    console.error('Error fetching systems:', err);
    res.status(500).send('Error fetching systems');
  }
});

// Get sub-systems for a given system
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

router.get('/api/symptoms/:subSystem', async (req, res) => {
  try {
    const db = getDb();
    const subSystem = req.params.subSystem;

    // Get all symptoms for all conditions under this sub-system
    const [rows] = await db.execute(
      'SELECT symptoms FROM va_disabilities WHERE sub_systems = ?',
      [subSystem]
    );

    // Collect all symptoms into one array, splitting by comma and trimming spaces
    let allSymptoms = [];
    rows.forEach(row => {
      if (row.symptoms) {
        const splitSymptoms = row.symptoms
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
        allSymptoms = allSymptoms.concat(splitSymptoms);
      }
    });

    // Remove duplicates by creating a Set, then back to array
    const uniqueSymptoms = [...new Set(allSymptoms)];

    res.json(uniqueSymptoms);
  } catch (err) {
    console.error('Error fetching symptoms:', err);
    res.status(500).json({ error: 'Failed to fetch symptoms' });
  }
});


// Analyze symptoms
router.post('/api/analyze-symptoms', async (req, res) => {
  try {
    const db = getDb();
    const entries = req.body; // [{ system, subSystem, symptoms: [] }]
    const results = [];

    for (const entry of entries) {
      if (!entry.subSystem || !entry.symptoms?.length) {
        results.push({ system: entry.system, subSystem: entry.subSystem, possibleConditions: [] });
        continue;
      }

      const placeholders = entry.symptoms.map(() => 'symptoms LIKE ?').join(' OR ');
      const params = entry.symptoms.map(symptom => `%${symptom}%`);
      params.unshift(entry.subSystem);

      const query = `
        SELECT condition_name, medical_code, presumptive_raw, qualifying_circumstance, evidence_basis
        FROM va_disabilities
        WHERE sub_systems = ? AND (${placeholders})
      `;

      const [conditions] = await db.execute(query, params);

      results.push({
        system: entry.system,
        subSystem: entry.subSystem,
        possibleConditions: conditions,
      });
    }

    res.json(results);
  } catch (err) {
    console.error('Analysis failed:', err);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

module.exports = router;
