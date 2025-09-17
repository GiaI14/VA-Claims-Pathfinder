document.addEventListener('DOMContentLoaded', () => {
  const ratingButtons = document.querySelectorAll('.rating-btn');
  const selectedRatingsContainer = document.getElementById('selected-ratings');
  const currentRatingDisplay = document.getElementById('currentRating');
  const desiredRatingInput = document.getElementById('desiredRating');
  const pointsNeededDisplay = document.getElementById('pointsNeeded');
  const nextPercentDisplay = document.getElementById('nextPercentNeeded'); // new line

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

  // Calculate points needed to reach a specific target
  function calculatePointsNeeded(currentRatings, target) {
    if (!target || target <= 0) return 0;

    const combined = calculateCombinedRating(currentRatings);
    if (combined >= target) return 0;

    const remainingHealthy = 100 - combined;
    const pointsNeeded = ((target - combined) * 100) / remainingHealthy;

    return Math.ceil(pointsNeeded / 5) * 5; // VA increments
  }

  // Calculate points needed to reach the next % increase
  function calculatePointsToNextPercent(currentRatings) {
    const combined = calculateCombinedRating(currentRatings);
    const nextPercent = Math.floor(combined) + 1;
    if (nextPercent > 100) return 0;

    const remainingHealthy = 100 - combined;
    const pointsNeeded = ((nextPercent - combined) * 100) / remainingHealthy;

    return Math.ceil(pointsNeeded / 5) * 5;
  }

  // Update current rating and points needed
  function updateCurrentRating() {
    const combined = calculateCombinedRating(selectedRatings);
    currentRatingDisplay.textContent = Math.floor(combined) + '%';

    // Always show points to next percent
    const nextPoints = calculatePointsToNextPercent(selectedRatings);
    nextPercentDisplay.textContent = nextPoints;

    // Only show desired rating points if entered
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
