document.addEventListener('DOMContentLoaded', () => {
  const ratingButtons = document.querySelectorAll('.rating-btn');
  const selectedRatingsContainer = document.getElementById('selected-ratings');
  const currentRatingDisplay = document.getElementById('currentRating');
  const desiredRatingInput = document.getElementById('desiredRating');
  const nextBracketDisplay = document.getElementById('nextBracketPoints');
  const pointsNeededDisplay = document.getElementById('pointsNeeded');

  let selectedRatings = [];

  // VA-style combined rating calculation (highest first)
  function calculateCombinedRating(ratings) {
    const sorted = [...ratings].sort((a, b) => b - a); // highest first
    let remaining = 100;
    let combined = 0;
    sorted.forEach(r => {
      const add = (r * remaining) / 100;
      combined += add;
      remaining -= add;
    });
    return combined;
  }

  // VA brackets
  const vaBrackets = [10,20,30,40,50,60,70,80,90,95,100];

  // Get next VA bracket based on current rating
  function getNextVaBracket(current) {
    for (let b of vaBrackets) {
      if (current < b) return b;
    }
    return 100;
  }
////////////////////////////////////////////////////////////////////////////
  // Calculate points needed using remaining healthy fraction
function calculatePointsToTarget(currentRatings, targetBracket) {
    // Calculate combined rating and preserve decimals
    let combined = calculateCombinedRating([...currentRatings]);

    // Round combined to nearest whole number for VA
    const vaRounded = Math.round(combined); // 92.8 -> 93

    // VA rounded rating (multiples of 10)
    const vaBracket = Math.round(vaRounded / 10) * 10;

    // If VA rounded already meets or exceeds target, no points needed
    if (vaBracket >= targetBracket) return 0;

    // Calculate what raw combined rating would round to the target bracket
    let effectiveTarget;
    
    // For the target bracket to be achieved, the rounded value must be >= targetBracket
    // This happens when the raw combined rating is >= targetBracket - 0.5
    if (targetBracket === 100) {
        // Special case for 100% - need at least 95.5 to round to 100
        effectiveTarget = 95.5;
    } else {
        effectiveTarget = targetBracket - 5 + 0.5; // e.g., for 90%, need >= 85.5
    }

    // If we're already at/above the effective target, we need to go to next bracket
    if (combined >= effectiveTarget) {
        if (targetBracket === 100) {
            // Already at 100%, can't go higher
            return 0;
        }
        // Calculate points needed for next bracket
        return calculatePointsToTarget(currentRatings, targetBracket + 10);
    }

    // Special handling: 90 -> 95 (rounds to 100)
    if (combined >= 90 && targetBracket === 100) {
        const remainingHealthy = 100 - combined;
        const rawPointsNeeded = ((95 - combined) * 100) / remainingHealthy;
        return Math.ceil(rawPointsNeeded / 50) * 50;
    }

    const remainingHealthy = 100 - combined;
    const rawPointsNeeded = ((effectiveTarget - combined) * 100) / remainingHealthy;

    return Math.ceil(rawPointsNeeded / 10) * 10; // VA adds in 10s
}
//////////////////////////////////////////////////////////////////////////
  // Update current rating and outputs
 function updateCurrentRating() {
    const combined = calculateCombinedRating(selectedRatings);
    const roundedCombined = Math.round(combined);
    currentRatingDisplay.textContent = roundedCombined + '%'; // only for display

    // Use exact combined value for next bracket calculation
    const nextBracket = getNextVaBracket(combined); // <-- use combined, not rounded
    const pointsToNext = calculatePointsToTarget(selectedRatings, nextBracket);
    nextBracketDisplay.textContent = pointsToNext;

    // Points to desired rating (if entered)
    const desired = parseFloat(desiredRatingInput.value) || 0;
    if (desired > 0) {
      const pointsNeeded = calculatePointsToTarget(selectedRatings, desired);
      pointsNeededDisplay.textContent = pointsNeeded;
    } else {
      pointsNeededDisplay.textContent = '—';
    }
}

  // Handle rating button clicks
  ratingButtons.forEach(button => {
    button.addEventListener('click', () => {
      const rating = parseInt(button.dataset.rating);
      selectedRatings.push(rating);

      const selectedBtn = document.createElement('button');
      selectedBtn.className = 'rating-btn selected';
      selectedBtn.textContent = rating + '%';
      selectedBtn.dataset.rating = rating;

      selectedBtn.addEventListener('click', () => {
        const index = selectedRatings.indexOf(rating);
        if (index > -1) selectedRatings.splice(index, 1);
        selectedBtn.remove();
        updateCurrentRating();
      });

      selectedRatingsContainer.appendChild(selectedBtn);
      updateCurrentRating();
    });
  });

  // Update when desired rating changes
  desiredRatingInput.addEventListener('input', () => {
    updateCurrentRating();
  });
});
