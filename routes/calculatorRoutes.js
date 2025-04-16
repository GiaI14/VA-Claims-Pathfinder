const express = require('express')
const router = express.Router()

router.post('/calculate-disability', (req, res) => {
  let { ratings, spouse, childrenUnder18, childrenOver18, numParents } = req.body

  console.log('Received request with:', {
    ratings,
    spouse,
    childrenUnder18,
    childrenOver18,
    numParents
  })

  // Validate ratings input
  if (
    !Array.isArray(ratings) ||
    ratings.length === 0 ||
    ratings.some(r => typeof r !== 'number' || r < 0 || r > 100)
  ) {
    return res.json({
      error:
        'Invalid or missing ratings input. Ratings should be an array of numbers between 0 and 100.'
    })
  }

  // Default values for spouse and children
  spouse = !!spouse // Convert to boolean
  childrenUnder18 = childrenUnder18 || 0
  childrenOver18 = childrenOver18 || 0
  numParents = numParents || 0

  // Sort ratings in descending order and calculate exact rating
  ratings.sort((a, b) => b - a);
  console.log('Sorted ratings:', ratings);

  // let exactRating = 0;
  // ratings.forEach(rating => {
  //   exactRating += rating * (1 - exactRating / 100);
  // });

  // // Round to the nearest whole number for exact rating
  // exactRating = Math.round(exactRating);
  let exactRating = 0;
  let remainingEfficiency = 100;

  for (const rating of ratings) {
    const decrement = (rating / 100) * remainingEfficiency;
    exactRating += decrement;
    remainingEfficiency -= decrement;
  }

  exactRating = Math.ceil(exactRating);

  console.log('Exact Rating after calculation:', exactRating);

  // VA rounding logic: Round down to nearest multiple of 10% unless halfway or higher
  let roundedRating = exactRating % 10 >= 5
    ? Math.ceil(exactRating / 10) * 10 // Round up if halfway or higher
    : Math.floor(exactRating / 10) * 10; // Round down otherwise

  console.log('Exact Rating:', exactRating);
  console.log('Rounded Rating:', roundedRating);

  // Base VA Compensation Table (Latest VA Rates 02/2025)
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
    100: 3831.3
  }

  const compensationWithSpouse = {
    30: 601.42,
    40: 859.16,
    50: 1208.04,
    60: 1523.93,
    70: 1908.19,
    80: 2214.89,
    90: 2489.96,
    100: 4044.91
  }

  const compensationWithChildAndSpouse = {
    30: 648.42,
    40: 922.16,
    50: 1287.04,
    60: 1617.93,
    70: 2018.19,
    80: 2340.89,
    90: 2630.96,
    100: 4201.35
  }

  const compensationWithChildOver18Only = {
    30: 579.42,
    40: 831.16,
    50: 1173.04,
    60: 1480.93,
    70: 1858.19,
    80: 2158.89,
    90: 2425.96,
    100: 3974.15
  }

  const compensationWithChildOnly = {
    30: 579.42,
    40: 831.16,
    50: 1173.04,
    60: 1480.93,
    70: 1858.19,
    80: 2158.89,
    90: 2425.96,
    100: 3974.15
  }

  const childUnder18Pay = {
    30: 31,
    40: 42,
    50: 53,
    60: 63,
    70: 74,
    80: 84,
    90: 95,
    100: 106.14
  }

  const childOver18Pay = {
    30: 102,
    40: 137,
    50: 171,
    60: 205,
    70: 239,
    80: 274,
    90: 308,
    100: 342.85
  }

  const OneParent = {
    30: 51,
    40: 68,
    50: 85,
    60: 102,
    70: 120,
    80: 137,
    90: 154,
    100: 171.44

  }

  const TwoParents = {
    30: 102,
    40: 136,
    50: 170,
    60: 204,
    70: 240,
    80: 274,
    90: 308,
    100: 342.88
  }

  function calculateVACompensation(rating, spouse, childrenUnder18, childrenOver18, numParents) {
    let baseCompensation = 0

    console.log(
      `Calculating for rating: ${rating}, spouse: ${spouse}, childrenUnder18: ${childrenUnder18}, childrenOver18: ${childrenOver18}, numParents: ${numParents}`
    )

    // 10% and 20% ratings have fixed base pay, no dependents considered
    if (rating === 10 || rating === 20) {
      return basePay[rating] || 0
    }

    // Calculate base compensation
    if (!spouse && childrenUnder18 === 0 && childrenOver18 === 0) {
      baseCompensation = basePay[rating] || 0
    } else if (spouse && childrenUnder18 === 0 && childrenOver18 === 0) {
      baseCompensation = compensationWithSpouse[rating] || 0
    } else if (spouse && (childrenUnder18 > 0 || childrenOver18 > 0)) {
      baseCompensation = compensationWithChildAndSpouse[rating] || 0
    } else if (!spouse && (childrenUnder18 > 0 || childrenOver18 > 0)) {
      baseCompensation = childrenUnder18 > 0
        ? compensationWithChildOnly[rating]
        : compensationWithChildOver18Only[rating]
    }

    // Add compensation for parents
    if (numParents === 1) {
      baseCompensation += OneParent[rating] || 0
    } else if (numParents === 2) {
      baseCompensation += TwoParents[rating] || 0
    }

    // Add compensation for children
    const additionalChildrenUnder18 = Math.max(0, childrenUnder18 - 1)
    baseCompensation += childUnder18Pay[rating] * additionalChildrenUnder18

    if (childrenUnder18 > 0) {
      baseCompensation += childOver18Pay[rating] * childrenOver18
    } else {
      baseCompensation += childOver18Pay[rating] * Math.max(0, childrenOver18 - 1)
    }

    console.log(`Final compensation: $${baseCompensation.toFixed(2)}`)
    return parseFloat(baseCompensation.toFixed(2))
  }
  // Calculate the total compensation based on the input values
  let totalCompensation = calculateVACompensation(
    roundedRating,
    spouse,
    childrenUnder18,
    childrenOver18,
    numParents
  )
  console.log(`Total Compensation: $${totalCompensation.toFixed(2)}`)

  // Return the result as a JSON response
  res.json({
    exactRating: exactRating.toFixed(2),
    roundedRating,
    totalCompensation: totalCompensation.toFixed(2)
  })
})

module.exports = router