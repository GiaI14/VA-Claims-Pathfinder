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
// POST /api/analyze-symptoms
router.post("/api/analyze-symptoms", (req, res, next) => {
  console.log("CSRF token sent by client:", req.headers['x-csrf-token']);
  next();
}, async (req, res) => {
  console.log("Received symptom data:", req.body);
  const { subSystem, chosenSymptoms } = req.body;

  if (!subSystem || !Array.isArray(chosenSymptoms) || chosenSymptoms.length === 0) {
    return res.status(400).json({ error: "Missing required data" });
  }

  try {
    const db = getDb();
    const [rows] = await db.execute(
      'SELECT id, sub_systems, condition_name, medical_code, symptoms, secondary_conditions, presumptive_conditions, qualifying_circumstance, evidence_basis FROM va_disabilities WHERE sub_systems = ?',
      [subSystem]
    );

    const possibleConditions = [];

    for (const row of rows) {
      if (!row.symptoms || typeof row.symptoms !== "string") continue;

      const conditionSymptoms = row.symptoms.split(',').map(s => s.trim().toLowerCase());
      const matchedCount = chosenSymptoms.reduce((count, symptom) => {
        return conditionSymptoms.includes(symptom.toLowerCase()) ? count + 1 : count;
      }, 0);

      const matchPercent = conditionSymptoms.length > 0
        ? (matchedCount / conditionSymptoms.length) * 100
        : 0;

      if (matchPercent > 25) { // minimum threshold
        possibleConditions.push({
          condition_name: row.condition_name,
          medical_code: row.medical_code,
          match_percentage: Number(matchPercent.toFixed(2)),
          matched_symptoms: chosenSymptoms.filter(symptom =>
            conditionSymptoms.includes(symptom.toLowerCase())
          ),
          total_condition_symptoms: conditionSymptoms.length,
          is_presumptive: row.presumptive_conditions && row.presumptive_conditions.toLowerCase().trim() !== 'no',
          presumptive_raw: row.presumptive_conditions,
          secondary_conditions: row.secondary_conditions,
          qualifying_circumstance: row.qualifying_circumstance || null,
          evidence_basis: row.evidence_basis || null
        });
      }
    }

    let results;
    if (possibleConditions.length === 0) {
      results = [{
        subSystem,
        message: `No matching conditions found for ${subSystem}. Please add more symptoms for better accuracy.`
      }];
    } else {
      possibleConditions.sort((a, b) => b.match_percentage - a.match_percentage);
      results = [{
        subSystem,
        chosenSymptoms,
        possibleConditions: possibleConditions.slice(0, 3)
      }];
    }

    console.log("Analysis results:", JSON.stringify(results, null, 2));
    res.json(results);

  } catch (err) {
    console.error("Error analyzing symptoms:", err);
    res.status(500).json({ error: "Failed to analyze symptoms", details: err.message });
  }
});


module.exports = router;
