document.addEventListener('DOMContentLoaded', () => {
  const ratingButtons = document.querySelectorAll('.rating-btn');
  const selectedRatingsContainer = document.getElementById('selected-ratings');
  const currentRatingDisplay = document.getElementById('currentRating');
  const desiredRatingInput = document.getElementById('desiredRating');
  const nextBracketDisplay = document.getElementById('nextBracketPoints');
  const pointsNeededDisplay = document.getElementById('pointsNeeded');

  let selectedRatings = [];

  // VA-style combined rating calculation
  function calculateCombinedRating(ratings) {
    let remaining = 100;
    let combined = 0;
    ratings.forEach(r => {
      const add = (r * remaining) / 100;
      combined += add;
      remaining -= add;
    });
    return combined;
  }

  // VA brackets
  function getNextVaBracket(current) {
    const brackets = [10,20,30,40,50,60,70,80,90,95,100];
    for (let b of brackets) {
      if (current < b) return b;
    }
    return 100;
  }

  // Calculate points needed for a target
  function calculatePointsNeeded(currentRatings, target) {
    const combined = calculateCombinedRating(currentRatings);

    if (combined >= target) return 0;

    const remainingHealthy = 100 - combined;
    const rawPointsNeeded = ((target - combined) * 100) / remainingHealthy;

    // Round up to nearest 10 (VA increments)
    return Math.ceil(rawPointsNeeded / 10) * 10;
  }

  // Update current rating and outputs
  function updateCurrentRating() {
    const combined = calculateCombinedRating(selectedRatings);
    const currentWhole = Math.floor(combined);
    currentRatingDisplay.textContent = currentWhole + '%';

    // Always calculate next VA bracket points
    const nextBracket = getNextVaBracket(currentWhole);
    const pointsToNext = calculatePointsNeeded(selectedRatings, nextBracket);
    nextBracketDisplay.textContent = pointsToNext;

    // Only calculate desired if entered
    const desired = parseFloat(desiredRatingInput.value) || 0;
    if (desired > 0) {
      const pointsNeeded = calculatePointsNeeded(selectedRatings, desired);
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
