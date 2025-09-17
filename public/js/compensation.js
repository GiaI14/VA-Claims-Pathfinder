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

  // Get next VA bracket above current
  function getNextVaBracket(current) {
    for (let b of vaBrackets) {
      if (current < b) return b;
    }
    return 100;
  }

  // Calculate points needed to reach a target VA rating
  function calculatePointsNeeded(currentCombined, target) {
    if (currentCombined >= target) return 0;

    const remainingHealthy = 100 - currentCombined;
    const rawPoints = ((target - currentCombined) / remainingHealthy) * 100;

    // Round up to nearest 5 points for VA increments
    return Math.ceil(rawPoints / 5) * 5;
  }

  // Update display
  function updateCurrentRating() {
    const combined = calculateCombinedRating(selectedRatings);
    const currentWhole = Math.floor(combined);
    currentRatingDisplay.textContent = currentWhole + '%';

    // Points to next VA bracket
    const nextBracket = getNextVaBracket(currentWhole);
    const pointsToNext = calculatePointsNeeded(combined, nextBracket);
    nextBracketDisplay.textContent = pointsToNext;

    // Points needed to desired rating
    const desired = parseFloat(desiredRatingInput.value) || 0;
    if (desired > 0) {
      const pointsNeeded = calculatePointsNeeded(combined, desired);
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
