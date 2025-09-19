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
    // First, calculate what VA bracket the current rating would round to
    const currentVaBracket = Math.round(Math.round(current) / 10) * 10;
    
    // If already at 100%, return 100
    if (currentVaBracket >= 100) return 100;
    
    // Find the index of the current bracket
    const currentIndex = vaBrackets.indexOf(currentVaBracket);
    
    // If current rating is high enough to already round to this bracket,
    // we need to target the NEXT bracket
    let minRatingForCurrentBracket;
    if (currentVaBracket === 100) {
        minRatingForCurrentBracket = 95.5;
    } else {
        minRatingForCurrentBracket = currentVaBracket - 5 + 0.5;
    }
    
    if (current >= minRatingForCurrentBracket) {
        // Already rounding to current bracket, so target next one
        return vaBrackets[currentIndex + 1] || 100;
    }
    
    // Otherwise, target the current bracket
    return currentVaBracket;
}
////////////////////////////////////////////////////////////////////////////
  // Calculate points needed using remaining healthy fraction
function calculatePointsToTarget(currentRatings, targetBracket) {
    // Calculate combined rating and preserve decimals
    let combined = calculateCombinedRating([...currentRatings]);

    // Get current VA bracket (rounded to nearest 10)
    const currentBracket = Math.round(Math.round(combined) / 10) * 10;

    // If current bracket already meets or exceeds target, no points needed
    if (currentBracket >= targetBracket) return 0;

    // Calculate the minimum raw rating needed to reach target bracket
    let minRatingForTarget;
    
    if (targetBracket === 100) {
        // For 100% bracket, need at least 95.5 (rounds to 100)
        minRatingForTarget = 95.5;
    } else {
        // For other brackets, need at least (targetBracket - 5 + 0.5)
        // Example: for 90% bracket, need at least 85.5 (rounds to 90)
        minRatingForTarget = targetBracket - 5 + 0.5;
    }

    // If we're already at/above the minimum rating for target bracket
    if (combined >= minRatingForTarget) {
        // We're already in this bracket or will round to it
        // Check if we want to go to the NEXT bracket
        const nextBracket = targetBracket + 10;
        
        // If next bracket would exceed 100%, return 0 (can't go higher)
        if (nextBracket > 100) return 0;
        
        // Recursively calculate points needed for next bracket
        return calculatePointsToTarget(currentRatings, nextBracket);
    }

    // Special handling for going from 90+ to 100%
    if (combined >= 90 && targetBracket === 100) {
        const remainingHealthy = 100 - combined;
        const rawPointsNeeded = ((95 - combined) * 100) / remainingHealthy;
        return Math.ceil(rawPointsNeeded / 50) * 50;
    }

    // Normal case: calculate points needed to reach minRatingForTarget
    const remainingHealthy = 100 - combined;
    const rawPointsNeeded = ((minRatingForTarget - combined) * 100) / remainingHealthy;

    return Math.ceil(rawPointsNeeded / 10) * 10;
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
