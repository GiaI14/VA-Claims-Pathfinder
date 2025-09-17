document.addEventListener('DOMContentLoaded', () => {
  const ratingButtons = document.querySelectorAll('.rating-btn');
  const selectedRatingsContainer = document.getElementById('selected-ratings');
  const currentRatingDisplay = document.getElementById('currentRating');
  const desiredRatingInput = document.getElementById('desiredRating');
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

 function getNextVaBracket(current) {
  const brackets = [10,20,30,40,50,60,70,80,90,95,100];
  for (let b of brackets) {
    if (current < b) return b;
  }
  return 100;
}

// Calculate points needed to reach the next VA bracket
function calculatePointsNeeded(currentRatings) {
  const combined = calculateCombinedRating(currentRatings);
  const currentWhole = Math.floor(combined);

  const nextBracket = getNextVaBracket(currentWhole);
  if (currentWhole >= nextBracket) return 0;

  const remainingHealthy = 100 - combined;
  const pointsNeeded = ((nextBracket - combined) * 100) / remainingHealthy;

  // VA increments: round up to nearest 10
  return Math.ceil(pointsNeeded / 10) * 10;
}

  // Update current rating and points needed
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
