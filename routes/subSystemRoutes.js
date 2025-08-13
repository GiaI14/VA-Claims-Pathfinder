const express = require('express');
const router = express.Router();
const { getDb } = require('../data/database');

// Render main page with systems list
router.get('/sub-system', async (req, res) => {
  try {
    const db = getDb();
    const [systemsRows] = await db.execute(
      'SELECT DISTINCT systems FROM va_disabilities'
    );
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

// API: get sub-systems by system
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

// API: get symptoms by sub-system
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

    const uniqueSymptoms = [...new Set(allSymptoms)];
    res.json(uniqueSymptoms);
  } catch (err) {
    console.error('Error fetching symptoms:', err);
    res.status(500).json({ error: 'Failed to fetch symptoms' });
  }
});

// API: analyze symptoms
router.post('/api/analyze-symptoms', async (req, res) => {
  console.log('Request body:', req.body);
  try {
    const { subSystem, chosenSymptoms } = req.body;
    console.log('subSystem:', subSystem, 'chosenSymptoms:', chosenSymptoms);
    
    if (!subSystem || !Array.isArray(chosenSymptoms) || chosenSymptoms.length === 0) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    const db = getDb();
    const [rows] = await db.execute(
      'SELECT condition_name, medical_code, symptoms FROM va_disabilities WHERE sub_systems = ?',
      [subSystem]
    );

    const results = rows.map(row => {
      const conditionSymptoms = row.symptoms
        ? row.symptoms.split(',').map(s => s.trim().toLowerCase())
        : [];

      const matchedCount = chosenSymptoms.reduce((count, symptom) => {
        return conditionSymptoms.includes(symptom.toLowerCase()) ? count + 1 : count;
      }, 0);

      const matchPercent = conditionSymptoms.length > 0
        ? (matchedCount / conditionSymptoms.length) * 100
        : 0;

      return {
        condition_name: row.condition_name,
        medical_code: row.medical_code,
        matchPercent: parseFloat(matchPercent.toFixed(2))
      };
    });

    results.sort((a, b) => b.matchPercent - a.matchPercent);

    res.json(results);
  } catch (err) {
    console.error('Error analyzing symptoms:', err);
    res.status(500).json({ error: 'Failed to analyze symptoms' });
  }
});

module.exports = router;
