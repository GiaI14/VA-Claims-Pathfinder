const express = require("express");
const router = express.Router();

// VA Compensation Tables
const basePay = {
  10: 175.51,
  20: 346.95,
  30: 537.42,
  40: 774.16,
  50: 1102.04,
  60: 1395.93,
  70: 1759.19,
  80: 2044.89,
  90: 2297.96,
  100: 3831.3,
};
const compensationWithSpouse = {
  30: 601.42,
  40: 859.16,
  50: 1208.04,
  60: 1523.93,
  70: 1908.19,
  80: 2214.89,
  90: 2489.96,
  100: 4044.91,
};
const compensationWithChildAndSpouse = {
  30: 648.42,
  40: 922.16,
  50: 1287.04,
  60: 1617.93,
  70: 2018.19,
  80: 2340.89,
  90: 2630.96,
  100: 4201.35,
};
const compensationWithChildOnly = {
  30: 579.42,
  40: 831.16,
  50: 1173.04,
  60: 1480.93,
  70: 1858.19,
  80: 2158.89,
  90: 2425.96,
  100: 3974.15,
};
const childUnder18Pay = {
  30: 31,
  40: 42,
  50: 53,
  60: 63,
  70: 74,
  80: 84,
  90: 95,
  100: 106.14,
};
const childOver18Pay = {
  30: 102,
  40: 137,
  50: 171,
  60: 205,
  70: 239,
  80: 274,
  90: 308,
  100: 342.85,
};
const OneParent = {
  30: 51,
  40: 68,
  50: 85,
  60: 102,
  70: 120,
  80: 137,
  90: 154,
  100: 171.44,
};
const TwoParents = {
  30: 102,
  40: 136,
  50: 170,
  60: 204,
  70: 240,
  80: 274,
  90: 308,
  100: 342.88,
};

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
  else baseComp += childOver18Pay[rating] * Math.max(0, childrenOver18 - 1);

  return parseFloat(baseComp.toFixed(2));
}

// Helper: VA rounds only at final step
function vaRound(rating) {
  return rating % 10 >= 5
    ? Math.ceil(rating / 10) * 10
    : Math.floor(rating / 10) * 10;
}

// Combined Rating with Bilateral Factor
function calculateVACombinedRating(ratings, bilateralRatings = []) {
  const sortedRatings = [...ratings].sort((a, b) => b - a);
  let efficiency = 100;

  for (const rating of sortedRatings) {
    efficiency -= (rating / 100) * efficiency;
  }

  let combinedRating = 100 - efficiency;

  // Apply bilateral factor if applicable
  if (bilateralRatings.length > 0) {
    const bilateralSum = bilateralRatings.reduce((sum, rating) => sum + rating, 0);
    const bilateralFactor = bilateralSum * 0.1;
    combinedRating += bilateralFactor;
    if (combinedRating > 100) combinedRating = 100;
  }

  return combinedRating;
}

// Route: POST /compensation/calculate
router.post("/calculate", (req, res) => {
  let { currentRating, bilateralRatings, spouse, childrenUnder18, childrenOver18, numParents } = req.body;

  spouse = !!spouse;
  childrenUnder18 = childrenUnder18 || 0;
  childrenOver18 = childrenOver18 || 0;
  numParents = numParents || 0;

  // Ratings array
  let ratings = Array.isArray(currentRating)
    ? currentRating.map(Number)
    : [Number(currentRating)];
  ratings = ratings.filter((r) => !isNaN(r) && r > 0);

  let bilaterals = Array.isArray(bilateralRatings)
    ? bilateralRatings.map(Number)
    : [];
  bilaterals = bilaterals.filter((r) => !isNaN(r) && r > 0);

  // Calculate combined rating
  const exactDecimal = calculateVACombinedRating(ratings, bilaterals); // e.g., 66.4
  const exactWhole = Math.floor(exactDecimal); // truncate, e.g., 66
  const roundedRating = vaRound(exactWhole); // nearest 10, e.g., 70

  // Compensation
  const currentComp = calculateVACompensation(
    roundedRating,
    spouse,
    childrenUnder18,
    childrenOver18,
    numParents
  );
  const maxComp = calculateVACompensation(
    100,
    spouse,
    childrenUnder18,
    childrenOver18,
    numParents
  );

  const missingPoints = 100 - roundedRating;
  const difference = maxComp - currentComp;

  res.json({
  exactDecimal: exactDecimal.toFixed(2) + "%", // 66.40%
  exactWhole: exactWhole + "%",                // 66%
  roundedRating: roundedRating + "%",          // 70%
  currentCombinedRating: exactWhole + "%",     // 👈 use this for frontend display
  currentCompensation: currentComp.toFixed(2),
  maxCompensation: maxComp.toFixed(2),
  missingPoints,
  difference: difference.toFixed(2),
  });
});

module.exports = router;
