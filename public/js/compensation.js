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
    const roundedIndividual = Math.round(current);
    const currentVaBracket = Math.round(roundedIndividual / 10) * 10;
    
    // If already at 100%, return 100
    if (currentVaBracket >= 100) return 100;
    
    // Find the index of the current bracket
    const currentIndex = vaBrackets.indexOf(currentVaBracket);
    if (currentIndex === -1) return 100; // shouldn't happen
    
    // Calculate minimum rating needed for current bracket
    let minRatingForCurrentBracket;
    if (currentVaBracket === 100) {
        minRatingForCurrentBracket = 95.5;
    } else if (currentVaBracket === 95) {
        minRatingForCurrentBracket = 90.0; // Special case: 90+ rounds to 95
    } else {
        minRatingForCurrentBracket = currentVaBracket - 5 + 0.5;
    }
    
    // Check if current rating is high enough to achieve current bracket
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

    // Calculate minimum rating needed for target bracket
    let minRatingForTarget;
    if (targetBracket === 100) {
        minRatingForTarget = 95; // Need ≥95% for 100% bracket
    } else if (targetBracket === 95) {
        minRatingForTarget = 90; // Need ≥90% for "95%" display
    } else {
        minRatingForTarget = targetBracket - 5; // Normal case: X bracket requires ≥(X-5)%
    }

    // If already at/above target threshold, return 0
    if (combined >= minRatingForTarget) return 0;

    // Calculate points needed using remaining healthy percentage
    const remainingHealthy = 100 - combined;
    const rawPointsNeeded = ((minRatingForTarget - combined) * 100) / remainingHealthy;

    // Always round up to nearest 10 points
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
