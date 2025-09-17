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
 function calculatePointsNeeded(currentRatings) {
  const combined = calculateCombinedRating(currentRatings);

  // VA rounds 95+ to 100, so calculate points needed to reach 95
  if (combined >= 95) return 0;

  const remainingEfficiency = 100 - combined;
  const pointsNeeded = (95 - combined) * 100 / remainingEfficiency;

  return Math.ceil(pointsNeeded);
}

  // Update display
 function updateCurrentRating() {
  const combined = calculateCombinedRating(selectedRatings);
  currentRatingDisplay.textContent = Math.floor(combined) + '%';

  const pointsNeeded = calculatePointsNeeded(selectedRatings);
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
