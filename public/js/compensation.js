document.addEventListener('DOMContentLoaded', () => {
  const ratingButtons = document.querySelectorAll('.rating-btn');
  const selectedRatingsContainer = document.getElementById('selected-ratings');
  const currentRatingDisplay = document.getElementById('currentRating');
  const desiredRatingInput = document.getElementById('desiredRating');
  const pointsNeededDisplay = document.getElementById('pointsNeeded');

  let selectedRatings = [];

  // VA-style combined rating
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

  // Calculate points needed to reach desired rating
  function calculatePointsNeeded(currentRatings, desired) {
    if (!desired || desired <= 0) return 0;

    const combined = calculateCombinedRating(currentRatings);
    if (combined >= desired) return 0;

    let remainingEfficiency = 100;
    currentRatings.forEach(r => {
      remainingEfficiency -= (r / 100) * remainingEfficiency;
    });

    const desiredRemaining = 100 - desired;
    const extraNeeded = remainingEfficiency - desiredRemaining;

    return Math.ceil(extraNeeded);
  }

  // Update display
 function updateCurrentRating() {
  const combined = calculateCombinedRating(selectedRatings);

  // Display truncated for current rating
  const combinedDisplay = Math.floor(combined);
  currentRatingDisplay.textContent = combinedDisplay + '%';

  const desired = parseFloat(desiredRatingInput.value) || 0;

  // Points needed calculation uses the full decimal
  let pointsNeeded = 0;
  if (combined < desired) {
    pointsNeeded = Math.ceil(desired - combined);
  }

  pointsNeededDisplay.textContent = pointsNeeded;
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

  // Update points needed when desired rating changes
  desiredRatingInput.addEventListener('input', () => {
    updateCurrentRating();
  });
});
