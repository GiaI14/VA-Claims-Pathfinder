const express = require("express");
const { getDb } = require('../data/database');
const natural = require('natural');
const stringSimilarity = require('string-similarity');
const tokenizer = new natural.WordTokenizer();
const router = express.Router();

function tokenizeAndNormalize(symptoms) {
  if (typeof symptoms !== 'string') return [];

  return symptoms
    .split(",")
    .flatMap(symptom => tokenizer.tokenize(symptom))
    .map(token =>
      token.toLowerCase().replace(/[^\w\s]/g, "")
    )
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

router.post("/api/analyze-symptoms", async (req, res) => {
  console.log("Received symptom data:", req.body);

  const entries = req.body; // Array of entries [{ system, subSystem, inputMethod, symptoms }]
  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: "Invalid input data. Must provide entries." });
  }

  try {
    const pool = getDb();
    const results = [];

    for (const entry of entries) {
      const { system, subSystem, inputMethod, symptoms } = entry;
      console.log("Processing entry:", entry);

      if (!system || !subSystem || !inputMethod || !Array.isArray(symptoms) || symptoms.length === 0) {
        console.warn(`Skipping invalid entry: ${JSON.stringify(entry)}`);
        continue;
      }

      // Fetch conditions at sub-system level
      const [rows] = await pool.execute(
        `SELECT 
            id, systems, sub_systems, condition_name, medical_code, 
            symptoms, secondary_conditions, presumptive_conditions,
            qualifying_circumstance, evidence_basis
         FROM va_disabilities 
         WHERE systems = ? AND sub_systems = ?`,
        [system, subSystem]
      );

      let possibleConditions = [];

      for (const row of rows) {
        if (!row.symptoms || typeof row.symptoms !== "string") continue;

        let matchPercentage;
        try {
          // If typed → fuzzy match; if selected → exact overlap
          if (inputMethod === "typing") {
            matchPercentage = calculateMatchPercentage(symptoms, row.symptoms);
          } else {
            const conditionSymptoms = row.symptoms.split(',').map(s => s.trim().toLowerCase());
            const matchedCount = symptoms.reduce((count, s) =>
              conditionSymptoms.includes(s.toLowerCase()) ? count + 1 : count, 0
            );
            matchPercentage = conditionSymptoms.length > 0
              ? (matchedCount / conditionSymptoms.length) * 100
              : 0;
          }
        } catch (err) {
          console.error("Error calculating match:", err, { symptoms, rowSymptoms: row.symptoms });
          continue;
        }

        if (matchPercentage > 25) {
          possibleConditions.push({
            condition_name: row.condition_name,
            medical_code: row.medical_code,
            match_percentage: Number(matchPercentage.toFixed(2)),
            matched_symptoms: symptoms.filter(symptom =>
              row.symptoms.toLowerCase().includes(symptom.toLowerCase())
            ),
            total_condition_symptoms: row.symptoms.split(',').length,
            is_presumptive: row.presumptive_conditions && row.presumptive_conditions.toLowerCase().trim() !== "no",
            presumptive_raw: row.presumptive_conditions,
            secondary_conditions: row.secondary_conditions,
            qualifying_circumstance: row.qualifying_circumstance || null,
            evidence_basis: row.evidence_basis || null
          });
        }
      }

      if (possibleConditions.length === 0) {
        results.push({
          system,
          sub_system: subSystem,
          message: `No matching conditions found for ${subSystem}. Please add more symptoms for better accuracy.`
        });
      } else {
        possibleConditions.sort((a, b) => b.match_percentage - a.match_percentage);
        results.push({
          system,
          sub_system: subSystem,
          symptoms,
          possibleConditions: possibleConditions.slice(0, 3)
        });
      }
    }

    console.log("Final results:", JSON.stringify(results, null, 2));
    res.json(results);

  } catch (err) {
    console.error("Error analyzing symptoms:", err);
    res.status(500).json({ error: "Failed to analyze symptoms", details: err.message });
  }
});

module.exports = router;
