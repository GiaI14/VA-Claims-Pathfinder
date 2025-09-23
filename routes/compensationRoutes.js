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

// -- Calculate VA Compensation --
function calculateVACompensation(rating, spouse, childrenUnder18, childrenOver18, numParents) {
  let baseComp = 0;

  if (rating === 10 || rating === 20) return basePay[rating] || 0;

  if (!spouse && childrenUnder18 === 0 && childrenOver18 === 0)
    baseComp = basePay[rating] || 0;
  else if (spouse && childrenUnder18 === 0 && childrenOver18 === 0)
    baseComp = compensationWithSpouse[rating] || 0;
  else if (spouse && (childrenUnder18 > 0 || childrenOver18 > 0))
    baseComp = compensationWithChildAndSpouse[rating] || 0;
  else if (!spouse && (childrenUnder18 > 0 || childrenOver18 > 0))
    baseComp = compensationWithChildOnly[rating] || 0;

  if (numParents === 1) baseComp += OneParent[rating] || 0;
  if (numParents === 2) baseComp += TwoParents[rating] || 0;

  const extraChildrenUnder18 = Math.max(0, childrenUnder18 - 1);
  baseComp += childUnder18Pay[rating] * extraChildrenUnder18;

  if (childrenUnder18 > 0)
    baseComp += childOver18Pay[rating] * childrenOver18;
  else
    baseComp += childOver18Pay[rating] * Math.max(0, childrenOver18 - 1);

  return parseFloat(baseComp.toFixed(2));
}

// -- VA Rounding Helper --
function vaRound(rating) {
  return rating % 10 >= 5 ? Math.ceil(rating / 10) * 10 : Math.floor(rating / 10) * 10;
}

// -- Combined Rating with Bilateral Factor --
function calculateVACombinedRating(ratings, bilateralRatings = []) {
  const sortedRatings = [...ratings].sort((a, b) => b - a);
  let efficiency = 100;

  for (const rating of sortedRatings) {
    efficiency -= (rating / 100) * efficiency;
  }

  let combinedRating = 100 - efficiency;

  if (bilateralRatings.length > 0) {
    const bilateralSum = bilateralRatings.reduce((sum, rating) => sum + rating, 0);
    const bilateralFactor = bilateralSum * 0.1;
    combinedRating += bilateralFactor;
    if (combinedRating > 100) combinedRating = 100;
  }

  return combinedRating;
}

// -- Next VA Bracket --
function getNextVaBracket(current) {
  const vaBrackets = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100];
  const individualRounded = Math.round(current);

  let currentBracket;
  if (individualRounded >= 90 && individualRounded <= 94) currentBracket = 95;
  else currentBracket = Math.round(individualRounded / 10) * 10;

  if (currentBracket >= 100) return 100;

  const currentIndex = vaBrackets.indexOf(currentBracket);
  return vaBrackets[currentIndex + 1] || 100;
}

// -- POST /calculate Route --
router.post("/calculate", (req, res) => {
  try {
    let { currentRating, bilateralRatings, spouse, childrenUnder18, childrenOver18, numParents } = req.body;

    // Ensure defaults
    spouse = !!spouse;
    childrenUnder18 = parseInt(childrenUnder18) || 0;
    childrenOver18 = parseInt(childrenOver18) || 0;
    numParents = parseInt(numParents) || 0;

    // Ratings array
    let ratings = Array.isArray(currentRating) ? currentRating.map(Number) : [Number(currentRating)];
    ratings = ratings.filter(r => !isNaN(r) && r > 0);

    let bilaterals = Array.isArray(bilateralRatings) ? bilateralRatings.map(Number) : [];
    bilaterals = bilaterals.filter(r => !isNaN(r) && r > 0);

    if (ratings.length === 0) throw new Error("No valid ratings provided");

    // Combined rating
    const exactDecimal = calculateVACombinedRating(ratings, bilaterals);
    const exactWhole = Math.floor(exactDecimal);
    const roundedRating = vaRound(exactWhole);

    // Current compensation
    const currentCompensation = calculateVACompensation(
      roundedRating, spouse, childrenUnder18, childrenOver18, numParents
    );

    // Next bracket
    const nextBracket = getNextVaBracket(roundedRating);
    const nextBracketCompensation = calculateVACompensation(
      nextBracket, spouse, childrenUnder18, childrenOver18, numParents
    );

    res.json({
      exactDecimal: exactDecimal.toFixed(2) + "%",
      exactWhole: exactWhole + "%",
      roundedRating: roundedRating + "%",
      nextBracket: nextBracket + "%",
      currentCompensation: currentCompensation.toFixed(2),
      nextBracketCompensation: nextBracketCompensation.toFixed(2),
      missingPoints: nextBracket - roundedRating,
      difference: (nextBracketCompensation - currentCompensation).toFixed(2)
    });

  } catch (err) {
    console.error("Error in /calculate:", err.message);
    res.status(200).json({ error: err.message });
  }
});

module.exports = router;
