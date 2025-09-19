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
    // FIX: calculate combined rating and preserve decimals
    let combined = calculateCombinedRating([...currentRatings]); // ensure this returns raw decimal

    // Round combined to nearest whole number for VA
    combined = Math.round(combined); // 92.8 -> 93

    // VA rounded rating (multiples of 10)
    const vaRounded = Math.round(combined / 10) * 10;

    // If VA rounded already meets or exceeds target, no points needed
    if (vaRounded >= targetBracket) return 0;

    // Find the next ".5 step" that rounds up to the targetBracket
    let effectiveTarget = targetBracket - 5;
  
     if ((combined % 1) >= 0.5) {
        effectiveTarget = targetBracket;
    }

  
    // If we're already at/above that .5 mark, bump to the next one
    if (combined >= effectiveTarget) {
        effectiveTarget += 10;
    }

    if (combined >= effectiveTarget) return 0;

    // Special handling: 90 -> 95 (rounds to 100)
    if (combined >= 90 && targetBracket >= 95) {
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
    currentRatingDisplay.textContent = roundedCombined + '%';

    // Points to next VA bracket
    const nextBracket = getNextVaBracket(roundedCombined);
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
