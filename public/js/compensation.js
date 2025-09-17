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
  function calculatePointsNeeded(currentRatings, desired) {
  const combined = calculateCombinedRating([...currentRatings]);

  if (combined >= desired) return 0;

  // Remaining healthy percent
  const remainingHealthy = 100 - combined;

  // Points needed from remaining healthy to reach target
  const rawPoints = ((desired - combined) * 100) / remainingHealthy;

  // Round up to next VA bracket increment (5 or 10 as needed)
  const pointsNeeded = Math.ceil(rawPoints / 5) * 5;

  return pointsNeeded;
}

  // Update current rating and outputs
 function updateCurrentRating() {
  const combined = calculateCombinedRating(selectedRatings);
  const currentWhole = Math.floor(combined);
  currentRatingDisplay.textContent = currentWhole + '%';

  // Calculate points to next VA bracket
  const nextBracket = getNextVaBracket(currentWhole);
  let pointsToNext = 0;
  if (combined < nextBracket) {
    const remainingHealthy = 100 - combined;
    pointsToNext = Math.ceil(((nextBracket - combined) * 100) / remainingHealthy);
  }
  nextBracketDisplay.textContent = pointsToNext > 0 ? pointsToNext : 0;

  // Calculate points to desired VA rating if input exists
  const desired = parseFloat(desiredRatingInput.value) || 0;
  let pointsNeeded = '—';
  if (desired > 0 && combined < desired) {
    const remainingHealthy = 100 - combined;
    pointsNeeded = Math.ceil(((desired - combined) * 100) / remainingHealthy);
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

  // Update when desired rating changes
  desiredRatingInput.addEventListener('input', () => {
    updateCurrentRating();
  });
});
