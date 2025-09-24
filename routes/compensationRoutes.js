const express = require("express");
const router = express.Router();

// -- VA Compensation Tables (your existing data) --
const basePay = { 10: 175.51, 20: 346.95, 30: 537.42, 40: 774.16, 50: 1102.04, 60: 1395.93, 70: 1759.19, 80: 2044.89, 90: 2297.96, 100: 3831.3 };
const compensationWithSpouse = { 30: 601.42, 40: 859.16, 50: 1208.04, 60: 1523.93, 70: 1908.19, 80: 2214.89, 90: 2489.96, 100: 4044.91 };
const compensationWithChildAndSpouse = { 30: 648.42, 40: 922.16, 50: 1287.04, 60: 1617.93, 70: 2018.19, 80: 2340.89, 90: 2630.96, 100: 4201.35 };
const compensationWithChildOnly = { 30: 579.42, 40: 831.16, 50: 1173.04, 60: 1480.93, 70: 1858.19, 80: 2158.89, 90: 2425.96, 100: 3974.15 };
const childUnder18Pay = { 30: 31, 40: 42, 50: 53, 60: 63, 70: 74, 80: 84, 90: 95, 100: 106.14 };
const childOver18Pay = { 30: 102, 40: 137, 50: 171, 60: 205, 70: 239, 80: 274, 90: 308, 100: 342.85 };
const OneParent = { 30: 51, 40: 68, 50: 85, 60: 102, 70: 120, 80: 137, 90: 154, 100: 171.44 };
const TwoParents = { 30: 102, 40: 136, 50: 170, 60: 204, 70: 240, 80: 274, 90: 308, 100: 342.88 };

// VA Compensation function
function calculateVACompensation(rating, spouse, childrenUnder18, childrenOver18, numParents) {
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
    const { currentRating, spouse, childrenUnder18, childrenOver18, numParents } = req.body;
    
    // Parse inputs
    const roundedRating = Math.round(Array.isArray(currentRating) ? Number(currentRating[0]) : Number(currentRating));
    const hasSpouse = !!spouse;
    const under18 = parseInt(childrenUnder18) || 0;
    const over18 = parseInt(childrenOver18) || 0;
    const parents = parseInt(numParents) || 0;

    // Calculate compensation
    const totalCompensation = calculateVACompensation(roundedRating, hasSpouse, under18, over18, parents);

    // Next bracket
    const nextBracket = getNextVaBracket(roundedRating);
    let nextBracketCompensation = null;
    if (nextBracket && nextBracket <= 100) {
      nextBracketCompensation = calculateVACompensation(nextBracket, hasSpouse, under18, over18, parents);
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

