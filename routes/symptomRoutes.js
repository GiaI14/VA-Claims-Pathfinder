const express = require("express");
const { getDb } = require('../data/database'); // Import getDb
const natural = require('natural');
const stringSimilarity = require('string-similarity');
const tokenizer = new natural.WordTokenizer();
const router = express.Router();

// Server-side route handler
function tokenizeAndNormalize(symptoms) {
    if (typeof symptoms !== 'string') {
        return [];
    }
    
    return symptoms
        .split(",")
        .flatMap(symptom => {
            // Tokenize each symptom phrase
            const tokens = tokenizer.tokenize(symptom);
            
            // Normalize each token
            return tokens.map(token => 
                token.toLowerCase()
                    .replace(/[^\w\s]/g, '')
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

function calculateSimilarity(str1, str2) {
    // Use a combination of Jaro-Winkler and Levenshtein distance for better accuracy
    const jaroWinkler = natural.JaroWinklerDistance(str1, str2);
    const levenshtein = natural.LevenshteinDistance(str1, str2) / Math.max(str1.length, str2.length);
    return (jaroWinkler + (1 - levenshtein)) / 2;
}

function tokenizeAndNormalize(symptoms) {
    if (typeof symptoms !== 'string') {
        return [];
    }

    return symptoms
        .split(",")
        .flatMap(symptom => symptom.trim().toLowerCase().split(/\s+/)) // Split by spaces too
        .map(token => token.replace(/[^\w]/g, '')) // Remove non-alphanumeric characters
        .filter(token => token.length > 1); // Remove single-character tokens
}


// router.post("/api/analyze-symptoms", async (req, res) => {
//     console.log("Received symptom data:", req.body);
//     const symptomsData = req.body;

//     if (!Array.isArray(symptomsData) || symptomsData.length === 0) {
//         return res.status(400).json({ error: "Invalid input data. Please provide an array of symptoms." });
//     }

//     try {
//         const pool = getDb();
//         const results = [];

//         for (const entry of symptomsData) {
//             const { system, symptoms } = entry;

//             if (!system || !Array.isArray(symptoms) || symptoms.length === 0) {
//                 console.warn(`Skipping invalid entry: ${JSON.stringify(entry)}`);
//                 continue;
//             }

//             // Fetch conditions only for the selected system
//             const [rows] = await pool.execute(
//                 `SELECT 
//                     id, systems, sub_systems, condition_name, medical_code, 
//                     symptoms, secondary_conditions, presumptive_conditions 
//                 FROM va_disabilities 
//                 WHERE systems = ?`,
//                 [system]
//             );

//             let possibleConditions = [];

//             for (const row of rows) {
//                 // Match input symptoms with condition symptoms
//                 const matchPercentage = calculateMatchPercentage(symptoms, row.symptoms);

//                 if (matchPercentage > 25) { // Only include conditions with at least 25% match
//                     possibleConditions.push({
//                         condition_name: row.condition_name,
//                         medical_code: row.medical_code,
//                         match_percentage: Number(matchPercentage.toFixed(2)),
//                         matched_symptoms: symptoms.filter(symptom => 
//                             row.symptoms.toLowerCase().includes(symptom.toLowerCase())
//                         ),
//                         total_condition_symptoms: row.symptoms.split(',').length,
//                         is_presumptive: row.presumptive_conditions && row.presumptive_conditions.toLowerCase().trim() === 'yes',
//                         presumptive_raw: row.presumptive_conditions, // Add this line
//                         secondary_conditions: row.secondary_conditions
//                     });
//                 }
//             }

//             // If no conditions match, add a "no match" message for this system
//             if (possibleConditions.length === 0) {
//                 results.push({
//                     system,
//                     message: `No matching conditions found for the selected system (${system}). Please add more symptoms for better accuracy.`,
//                 });
//             } else {
//                 possibleConditions.sort((a, b) => b.match_percentage - a.match_percentage);
//                 const topConditions = possibleConditions.slice(0, 3);

//                 results.push({
//                     system,
//                     symptoms,
//                     possibleConditions: topConditions.map(condition => ({
//                         ...condition,
//                         is_presumptive: condition.is_presumptive,
//                         presumptive_raw: condition.presumptive_raw
//                     }))
//                 });
//             }
//         }
//         console.log("Analysis results:", JSON.stringify(results, null, 2));
//         res.json(results);
//     } catch (error) {
//         console.error("Error querying database:", error.message);
//         res.status(500).json({ error: "An error occurred while analyzing symptoms.", details: error.message });
//     }
// });
///////////////////////////////////////////////////////////////////////////////////
router.post("/api/analyze-symptoms", async (req, res) => {
    console.log("Received symptom data:", req.body);
    const symptomsData = req.body;

    if (!Array.isArray(symptomsData) || symptomsData.length === 0) {
        return res.status(400).json({ error: "Invalid input data. Please provide an array of symptoms." });
    }

    try {
        const pool = getDb();
        const results = [];

        for (const entry of symptomsData) {
            const { system, symptoms } = entry;
            console.log("Processing entry:", entry);

            if (!system || !Array.isArray(symptoms) || symptoms.length === 0) {
                console.warn(`Skipping invalid entry: ${JSON.stringify(entry)}`);
                continue;
            }

            const [rows] = await pool.execute(
                `SELECT 
                    id, systems, sub_systems, condition_name, medical_code, 
                    symptoms, secondary_conditions, presumptive_conditions,
                    qualifying_circumstance, evidence_basis
                FROM va_disabilities 
                WHERE systems = ?`,
                [system]
            );

            let possibleConditions = [];

            for (const row of rows) {
                // Defensive: check if row.symptoms exists and is a string
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
                    const conditionData = {
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
                    };

                    possibleConditions.push(conditionData);
                }
            }

            if (possibleConditions.length === 0) {
                results.push({
                    system,
                    message: `No matching conditions found for the selected system (${system}). Please add more symptoms for better accuracy.`,
                });
            } else {
                possibleConditions.sort((a, b) => b.match_percentage - a.match_percentage);
                const topConditions = possibleConditions.slice(0, 3);

                results.push({
                    system,
                    symptoms,
                    possibleConditions: topConditions
                });
            }
        }
        
        console.log("Analysis results:", JSON.stringify(results, null, 2));
        res.json(results);
    } catch (error) {
        // Log the full error object, not just the message
        console.error("Error querying database:", error);
        res.status(500).json({ error: "An error occurred while analyzing symptoms.", details: error.message });
    }
});



module.exports = router;
