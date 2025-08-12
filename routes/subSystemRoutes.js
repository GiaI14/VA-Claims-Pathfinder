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
router.post("/api/analyze-symptoms", (req, res, next) => {
    console.log("Session ID:", req.sessionID);
    console.log("Session:", req.session);
    console.log("CSRF token sent by client:", req.headers['x-csrf-token']);
    next();
}, async (req, res) => {
    console.log("Received symptom data:", req.body);
    const symptomsData = req.body;

    if (!Array.isArray(symptomsData) || symptomsData.length === 0) {
        return res.status(400).json({ error: "Invalid input data. Please provide an array of symptoms." });
    }

    try {
        const pool = getDb();
        const results = [];

        for (const entry of symptomsData) {
            const { system, subSystem, symptoms } = entry;
            console.log("Processing entry:", entry);

            if (!system || !subSystem || !Array.isArray(symptoms) || symptoms.length === 0) {
                console.warn(`Skipping invalid entry: ${JSON.stringify(entry)}`);
                continue;
            }

            const [rows] = await pool.execute(
                `SELECT 
                    id, systems, sub_systems, condition_name, medical_code, 
                    symptoms, secondary_conditions, presumptive_conditions,
                    qualifying_circumstance, evidence_basis
                FROM va_disabilities 
                WHERE sub_systems = ?`,
                [subSystem]
            );

            let possibleConditions = [];

            for (const row of rows) {
                if (!row.symptoms || typeof row.symptoms !== 'string') {
                    console.warn("Skipping row with invalid symptoms:", row);
                    continue;
                }

                let matchPercentage;
                try {
                    matchPercentage = calculateMatchPercentage(symptoms, row.symptoms);
                } catch (err) {
                    console.error("Error in calculateMatchPercentage:", err, { symptoms, rowSymptoms: row.symptoms });
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
                        is_presumptive: row.presumptive_conditions && row.presumptive_conditions.toLowerCase().trim() !== 'no',
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
                    subSystem,
                    message: `No matching conditions found for ${system} → ${subSystem}. Please add more symptoms for better accuracy.`
                });
            } else {
                possibleConditions.sort((a, b) => b.match_percentage - a.match_percentage);
                const topConditions = possibleConditions.slice(0, 3);

                results.push({
                    system,
                    subSystem,
                    symptoms,
                    possibleConditions: topConditions
                });
            }
        }
        
        console.log("Analysis results:", JSON.stringify(results, null, 2));
        res.json(results);
    } catch (error) {
        console.error("Error querying database:", error);
        res.status(500).json({ error: "An error occurred while analyzing symptoms.", details: error.message });
    }
});



module.exports = router;
