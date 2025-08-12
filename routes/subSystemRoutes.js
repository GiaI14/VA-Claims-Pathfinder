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

// API: get sub-systems for a system
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

// API: get symptoms for a sub-system
router.get('/api/symptoms/:subSystem', async (req, res) => {
  try {
    const db = getDb();
    const subSystem = req.params.subSystem;
    const [rows] = await db.execute(
      'SELECT DISTINCT symptoms FROM va_disabilities WHERE sub_systems = ?',
      [subSystem]
    );
    const symptoms = rows.map(row => row.symptoms);
    res.json(symptoms);
  } catch (err) {
    console.error('Error fetching symptoms:', err);
    res.status(500).json({ error: 'Failed to fetch symptoms' });
  }
});

// API: analyze symptoms
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

      // Use placeholders for symptom matching
      const placeholders = entry.symptoms.map(() => '?').join(',');
      const query = `
        SELECT condition_name, medical_code, presumptive_raw, qualifying_circumstance, evidence_basis
        FROM va_disabilities
        WHERE sub_systems = ? AND symptoms IN (${placeholders})
      `;
      const params = [entry.subSystem, ...entry.symptoms];
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
