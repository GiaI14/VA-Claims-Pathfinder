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
 /////////////////////////////////////////////////////////////////////////////////////
  // Calculate points needed using remaining healthy fraction
function calculatePointsToTarget(currentRatings, targetBracket) {
    const combined = calculateCombinedRating([...currentRatings]);
    if (combined >= targetBracket) return 0;

    // Special handling: if current >= 90 and next bracket >= 95
    if (combined >= 90 && targetBracket >= 95) {
        const remainingHealthy = 100 - combined;
        // Points needed to reach 95, rounded to 50 (VA rounds to 100)
        const rawPointsNeeded = ((95 - combined) * 100) / remainingHealthy;
        return Math.ceil(rawPointsNeeded / 50) * 50;
    }

    // Handle combined rating above .5 bracket (15,25,35...) to next 10
    const decimalPart = combined % 10;
    if (decimalPart >= 5 && decimalPart < 10 && targetBracket < 95) {
        // push to next 10-point bracket
        const nextFullBracket = Math.ceil(combined / 10) * 10;
        const remainingHealthy = 100 - combined;
        const rawPointsNeeded = ((nextFullBracket - combined) * 100) / remainingHealthy;
        return Math.ceil(rawPointsNeeded / 10) * 10;
    }

    // Adjust target for other brackets
    let target;
    if (targetBracket >= 95) {
        target = 100; 
    } else {
        target = targetBracket - 5;
    }

    const remainingHealthy = 100 - combined;
    const rawPointsNeeded = ((target - combined) * 100) / remainingHealthy;

    // VA awards points in multiples of 10
    return Math.ceil(rawPointsNeeded / 10) * 10;
}


//////////////////////////////////////////////////////////////////////////////////////////////////

  // Update current rating and outputs
  function updateCurrentRating() {
    const combined = calculateCombinedRating(selectedRatings);
    currentRatingDisplay.textContent = Math.floor(combined) + '%';

    // Points to next VA bracket
    const nextBracket = getNextVaBracket(combined);
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
