const express = require("express");
const router = express.Router();

// Utility: round amount to nearest 10 for display
function roundForDisplay(amount) {
  return Math.round(amount / 10) * 10;
}

// Example calculation route
router.post("/calculate-compensation", (req, res) => {
  try {
    const { baseRate, rating, deductions } = req.body;

    // Use *exact* rating for math
    let exactAmount = baseRate * (rating / 100);

    // Apply deductions with exact value
    if (deductions && deductions.length > 0) {
      deductions.forEach(d => {
        exactAmount -= d.amount; // keep raw subtraction
      });
    }

    // Display-friendly version (rounded to nearest 10)
    const displayAmount = roundForDisplay(exactAmount);

    res.json({
      exactAmount,      // backend math
      displayAmount,    // frontend display
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Calculation failed" });
  }
});

module.exports = router;
