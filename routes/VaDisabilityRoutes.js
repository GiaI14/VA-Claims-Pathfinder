const express = require('express');
const router = express.Router();
const { getDb } = require('../data/database');
const natural = require('natural');
const stringSimilarity = require('string-similarity');
const tokenizer = new natural.WordTokenizer();

// ------------------ Utility Functions ------------------

function tokenizeAndNormalize(symptoms) {
  if (typeof symptoms !== 'string') return [];

  return symptoms
    .split(",")
    .flatMap(symptom => {
      const tokens = tokenizer.tokenize(symptom);
      return tokens.map(token =>
        token.toLowerCase().replace(/[^\w\s]/g, '')
      );
    })
    .filter(token => token.length > 1);
}

function calculateMatchPercentage(inputSymptoms, databaseSymptoms) {
  const inputTokens = tokenizeAndNormalize(inputSymptoms.join(", "));
  const databaseTokens = tokenizeAndNormalize(databaseSymptoms);

  const matchedTokens = inputTokens.filter(inputToken => {
    const matches = databaseTokens.map(dbToken =>
      stringSimilarity.compareTwoStrings(inputToken, dbToken)
    );
    return matches.some(match => match >= 0.5);
  });

  if (databaseTokens.length === 0) return 0;
  return Math.min((matchedTokens.length / databaseTokens.length) * 100, 100);
}

// ------------------ Routes ------------------

// Render test page
router.get('/VaDisabilityTest', async (req, res) => {
  try {
    const db = getDb();
    const [systemsRows] = await db.execute(
      'SELECT DISTINCT systems FROM va_disabilities'
    );
    const systems = systemsRows.map(row => row.systems);

    res.render('VaDisabilityTest', {
      csrfToken: req.csrfToken(),
      nonce: res.locals.nonce,
      systems
    });
  } catch (err) {
    console.error('Error fetching systems:', err);
    res.status(500).send('Error fetching systems');
  }
});

// API: Get sub-systems for a system
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

// API: Get symptoms for a sub-system
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

// API: Analyze symptoms
router.post('/api/analyze-symptoms', async (req, res) => {
  const { subSystem, chosenSymptoms } = req.body;

  if (!subSystem || !Array.isArray(chosenSymptoms) || chosenSymptoms.length === 0) {
    return res.status(400).json({ error: "Missing required data" });
  }

  try {
    const db = getDb();
    const [rows] = await db.execute(
      'SELECT * FROM va_disabilities WHERE sub_systems = ?',
      [subSystem]
    );

    const possibleConditions = [];

    for (const row of rows) {
      if (!row.symptoms || typeof row.symptoms !== "string") continue;

      const matchPercent = calculateMatchPercentage(chosenSymptoms, row.symptoms);

      if (matchPercent > 25) { // minimum threshold
        possibleConditions.push({
          condition_name: row.condition_name,
          medical_code: row.medical_code,
          match_percentage: Number(matchPercent.toFixed(2)),
          matched_symptoms: chosenSymptoms.filter(symptom =>
            row.symptoms.toLowerCase().includes(symptom.toLowerCase())
          ),
          total_condition_symptoms: row.symptoms.split(',').length,
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

    res.json(results);

  } catch (err) {
    console.error("Error analyzing symptoms:", err);
    res.status(500).json({ error: "Failed to analyze symptoms", details: err.message });
  }
});

module.exports = router;
