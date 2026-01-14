const express = require("express");
const router = express.Router();

// -- VA Compensation Tables (your existing data) --
const basePay = { 10: 180.42, 20: 356.66, 30: 552.47, 40: 795.84, 50: 1132.90, 60: 1435.02, 70: 1808.45, 80: 2102.15, 90: 2362.30, 100: 3938.58 };
  const compensationWithSpouse = { 30: 617.47, 40: 882.84, 50: 1241.90, 60: 1566.02, 70: 1961.45, 80: 2277.15, 90: 2559.30, 100: 4158.17 };
  const compensationWithChildAndSpouse = { 30: 666.47, 40: 947.84, 50: 1322.90, 60: 1663.02, 70: 2074.45, 80: 2406.15, 90: 2704.30, 100: 4318.99 };
  const compensationWithChildOnly = { 30: 596.47, 40: 853.84, 50: 1205.90, 60: 1523.02, 70: 1910.45, 80: 2219.15, 90: 2494.30, 100: 4085.43 };
  const childUnder18Pay = { 30: 32, 40: 43, 50: 54, 60: 65, 70: 76, 80: 87, 90: 98, 100: 109.11 };
  const childOver18Pay = { 30: 105, 40: 140, 50: 176, 60: 211, 70: 246, 80: 281, 90: 317, 100: 352.45 };
  const OneParent = { 30: 52, 40: 70, 50: 88, 60: 105, 70: 123, 80: 140, 90: 158, 100: 176.24 };
  const TwoParents = { 30: 104, 40: 140, 50: 176, 60: 210, 70: 246, 80: 280, 90: 316, 100: 352.48 };
  const aidAndAttendance = { 30: 61, 40: 81, 50: 101, 60: 121, 70: 141, 80: 161, 90: 181, 100: 201.41};

// VA Compensation function
function calculateVACompensation(rating, spouse, spouseAid, childrenUnder18, childrenOver18, numParents) {
  let baseCompensation = 0;

  console.log(`Calculating for rating: ${rating}, spouse: ${spouse}, childrenUnder18: ${childrenUnder18}, childrenOver18: ${childrenOver18}, numParents: ${numParents}`);

  if (rating === 10 || rating === 20) {
    return basePay[rating] || 0;
  }

  if (!spouse && childrenUnder18 === 0 && childrenOver18 === 0) {
    baseCompensation = basePay[rating] || 0;
  } else if (spouse && childrenUnder18 === 0 && childrenOver18 === 0) {
    baseCompensation = compensationWithSpouse[rating] || 0;
  } else if (spouse && (childrenUnder18 > 0 || childrenOver18 > 0)) {
    baseCompensation = compensationWithChildAndSpouse[rating] || 0;
  } else if (!spouse && (childrenUnder18 > 0 || childrenOver18 > 0)) {
    baseCompensation = compensationWithChildOnly[rating] || 0;
  }

  if (numParents === 1) baseCompensation += OneParent[rating] || 0;
  else if (numParents === 2) baseCompensation += TwoParents[rating] || 0;

  const additionalChildrenUnder18 = Math.max(0, childrenUnder18 - 1);
  baseCompensation += childUnder18Pay[rating] * additionalChildrenUnder18;

  if (childrenUnder18 > 0) {
    baseCompensation += childOver18Pay[rating] * childrenOver18;
  } else {
    baseCompensation += childOver18Pay[rating] * Math.max(0, childrenOver18 - 1);
  }

  if (spouse && spouseAid && rating >= 30) {
    baseCompensation += aidAndAttendance[rating] || 0;
  }
  console.log(`Final compensation: $${baseCompensation.toFixed(2)}`);
  return parseFloat(baseCompensation.toFixed(2));
}

const vaBrackets = [10,20,30,40,50,60,70,80,90,95,100];

function getNextVaBracket(current) {
  const individualRounded = Math.round(current);

  let currentBracket;
  if (individualRounded >= 90 && individualRounded <= 94) {
      currentBracket = 95;
  } else {
      currentBracket = Math.round(individualRounded / 10) * 10;
  }

  if (currentBracket >= 100) return 100;

  const currentIndex = vaBrackets.indexOf(currentBracket);
  return vaBrackets[currentIndex + 1] || 100;
}
//////////////////////////////////////////////////////////////////////////////////////////
function calculatePointsToTarget(currentRatings, targetBracket) {
  const vaBrackets = [10,20,30,40,50,60,70,80,90,95,100];

  function calculateCombinedRating(ratings) {
    const sorted = [...ratings].sort((a, b) => b - a); 
    let remaining = 100;
    let combined = 0;
    sorted.forEach(r => {
      const add = (r * remaining) / 100;
      combined += add;
      remaining -= add;
    });
    return combined;
  }

  let combined = calculateCombinedRating([...currentRatings]);

  let minRatingForTarget;
  if (targetBracket === 100) {
      minRatingForTarget = 95;
  } else if (targetBracket === 95) {
      minRatingForTarget = 90;
  } else {
      minRatingForTarget = targetBracket - 5;
  }

  if (combined >= minRatingForTarget) {
      let nextBracket;
      if (targetBracket === 95) nextBracket = 100;
      else if (targetBracket === 100) return 0;
      else nextBracket = targetBracket + 10;
      return calculatePointsToTarget(currentRatings, nextBracket);
  }

  const remainingHealthy = 100 - combined;
  const rawPointsNeeded = ((minRatingForTarget - combined) * 100) / remainingHealthy;

  return Math.ceil(rawPointsNeeded / 10) * 10;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.post("/calculate", (req, res) => {
  try {
    console.log("Received body:", req.body);
    const { currentRating, spouse, spouseAid, childrenUnder18, childrenOver18, numParents } = req.body;
    
    // Parse inputs
    const roundedRating = Math.round(Array.isArray(currentRating) ? Number(currentRating[0]) : Number(currentRating));
    const hasSpouse = !!spouse;
    const hasSpouse = spouse === true || spouse === "true";
    const hasSpouseAid = spouseAid === true || spouseAid === "true";
    const under18 = parseInt(childrenUnder18) || 0;
    const over18 = parseInt(childrenOver18) || 0;
    const parents = parseInt(numParents) || 0;

    // Calculate compensation
    const totalCompensation = calculateVACompensation(roundedRating, hasSpouse, hasSpouseAid, under18, over18, parents);

    // Next bracket
    const nextBracket = getNextVaBracket(roundedRating);
    let nextBracketCompensation = null;
    if (nextBracket && nextBracket <= 100) {
      nextBracketCompensation = calculateVACompensation(nextBracket, hasSpouse, hasSpouseAid, under18, over18, parents);
    }

    const pointsToNext = calculatePointsToTarget([roundedRating], nextBracket);

    // Send JSON
    res.json({
      roundedRating: roundedRating + "%",
      totalCompensation: totalCompensation.toFixed(2),
      nextBracket: nextBracket ? nextBracket + "%" : null,
      nextBracketCompensation: nextBracketCompensation ? nextBracketCompensation.toFixed(2) : null,
      pointsToNext
    });

  } catch (err) {
    console.error("Error in /calculate:", err);
    res.status(500).json({ error: "An error occurred while calculating VA compensation" });
  }
});


module.exports = router;

