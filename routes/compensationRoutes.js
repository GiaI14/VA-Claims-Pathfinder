const express = require("express");
const router = express.Router();

router.post("/calculate-disability-precise", (req, res) => {
  let { ratings, spouse, childrenUnder18, childrenOver18, numParents } = req.body;

  if (
    !Array.isArray(ratings) ||
    ratings.length === 0 ||
    ratings.some(r => typeof r !== "number" || r < 0 || r > 100)
  ) {
    return res.json({ error: "Invalid or missing ratings input." });
  }

  spouse = !!spouse;
  childrenUnder18 = childrenUnder18 || 0;
  childrenOver18 = childrenOver18 || 0;
  numParents = numParents || 0;

  ratings.sort((a, b) => b - a);

  let exactRating = 0;
  let remainingEfficiency = 100;

  for (const rating of ratings) {
    const decrement = (rating / 100) * remainingEfficiency;
    exactRating += decrement;
    remainingEfficiency -= decrement;
  }

  exactRating = Math.ceil(exactRating);

  let roundedRating =
    exactRating % 10 >= 5
      ? Math.ceil(exactRating / 10) * 10
      : Math.floor(exactRating / 10) * 10;

  // --- reuse your tables (can be imported or copied here) ---
  const basePay = {
    10: 175.51, 20: 346.95, 30: 537.42, 40: 774.16, 50: 1102.04,
    60: 1395.93, 70: 1759.19, 80: 2044.89, 90: 2297.96, 100: 3831.3
  };

  function calculateVACompensation(rating, spouse, childrenUnder18, childrenOver18, numParents) {
    // keep your original function here
    return basePay[rating] || 0;
  }

  let totalCompensation = calculateVACompensation(
    roundedRating,
    spouse,
    childrenUnder18,
    childrenOver18,
    numParents
  );

  res.json({
    exactRating: exactRating.toFixed(2),
    roundedRating,
    totalCompensation: totalCompensation.toFixed(2),
  });
});

module.exports = router;
