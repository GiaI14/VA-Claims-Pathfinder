const express = require('express');
const router = express.Router();

const { getDb } = require('../data/database');

// Get sub-systems for a given system
router.get('/api/sub-systems/:system', async (req, res) => {
  try {
    const { system } = req.params;
    const subs = await db.getSubSystems(system); // returns array of strings
    res.json(subs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sub-systems' });
  }
});

// Get symptoms for a given sub-system
router.get('/api/symptoms/:subSystem', async (req, res) => {
  try {
    const { subSystem } = req.params;
    const symptoms = await db.getSymptoms(subSystem); // returns array of strings
    res.json(symptoms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch symptoms' });
  }
});

// Analyze symptoms
router.post('/api/analyze-symptoms', async (req, res) => {
  try {
    const entries = req.body; // [{ system, subSystem, symptoms: [] }]
    const results = [];

    for (const entry of entries) {
      const conditions = await db.getMatchingConditions(entry.subSystem, entry.symptoms);
      results.push({
        system: entry.system,
        subSystem: entry.subSystem,
        possibleConditions: conditions
      });
    }

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

module.exports = router;

