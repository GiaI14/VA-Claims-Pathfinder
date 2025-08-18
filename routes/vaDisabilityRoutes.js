const express = require('express');
const router = express.Router();
const { getDb } = require('../data/database');

// --- Get all systems ---
router.get('/api/systems', async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.execute('SELECT DISTINCT systems FROM va_disabilities');
    const systems = rows.map(r => r.systems);
    res.json(systems);
  } catch (err) {
    console.error('Error fetching systems:', err);
    res.status(500).json({ error: 'Failed to fetch systems' });
  }
});

// --- Get sub-systems by system ---
router.get('/api/sub-systems/:system', async (req, res) => {
  try {
    const db = getDb();
    const system = req.params.system;
    const [rows] = await db.execute(
      'SELECT DISTINCT sub_systems FROM va_disabilities WHERE systems = ?',
      [system]
    );
    const subSystems = rows.map(r => r.sub_systems);
    res.json(subSystems);
  } catch (err) {
    console.error('Error fetching sub-systems:', err);
    res.status(500).json({ error: 'Failed to fetch sub-systems' });
  }
});

// --- Get symptoms by sub-system ---
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
        allSymptoms = allSymptoms.concat(row.symptoms.split(',').map(s => s.trim()).filter(Boolean));
      }
    });

    const uniqueSymptoms = [...new Set(allSymptoms)];
    res.json(uniqueSymptoms);
  } catch (err) {
    console.error('Error fetching symptoms:', err);
    res.status(500).json({ error: 'Failed to fetch symptoms' });
  }
});

// --- Analyze symptoms ---
router.post('/analyze-symptoms', async (req, res) => {
  const { subSystem, chosenSymptoms } = req.body;
  if (!subSystem || !Array.isArray(chosenSymptoms) || chosenSymptoms.length === 0) {
    return res.status(400).json({ error: 'Missing required data' });
  }

  try {
    const db = getDb();
    const [rows] = await db.execute(
      `SELECT condition_name, medical_code, symptoms, secondary_conditions, presumptive_conditions,
              qualifying_circumstance, evidence_basis
       FROM va_disabilities WHERE sub_systems = ?`,
      [subSystem]
    );

    const possibleConditions = rows
      .map(row => {
        if (!row.symptoms) return null;
        const conditionSymptoms = row.symptoms.split(',').map(s => s.trim().toLowerCase());
        const matchedCount = chosenSymptoms.reduce(
          (count, s) => conditionSymptoms.includes(s.toLowerCase()) ? count + 1 : count, 0
        );
        const match_percentage = conditionSymptoms.length > 0 ? (matchedCount / conditionSymptoms.length) * 100 : 0;
        if (match_percentage <= 25) return null;

        return {
          condition_name: row.condition_name,
          medical_code: row.medical_code,
          match_percentage: Number(match_percentage.toFixed(2)),
          matched_symptoms: chosenSymptoms.filter(s => conditionSymptoms.includes(s.toLowerCase())),
          total_condition_symptoms: conditionSymptoms.length,
          is_presumptive: row.presumptive_conditions?.toLowerCase().trim() !== 'no',
          presumptive_raw: row.presumptive_conditions,
          secondary_conditions: row.secondary_conditions,
          qualifying_circumstance: row.qualifying_circumstance,
          evidence_basis: row.evidence_basis
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.match_percentage - a.match_percentage)
      .slice(0, 3);

    res.json(possibleConditions.length > 0 ? possibleConditions : [{
      message: `No matching conditions found for ${subSystem}.`
    }]);

  } catch (err) {
    console.error('Error analyzing symptoms:', err);
    res.status(500).json({ error: 'Failed to analyze symptoms', details: err.message });
  }
});

module.exports = router;
