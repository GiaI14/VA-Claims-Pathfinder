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

  // Get the next VA bracket
  function getNextVaBracket(current) {
    const brackets = [10,20,30,40,50,60,70,80,90,95,100];
    for (let b of brackets) {
      if (current < b) return b;
    }
    return 100;
  }

  // Calculate points to reach the next VA bracket
  // Calculate points to reach next VA bracket
function calculatePointsToNextBracket(currentRatings) {
  const combined = calculateCombinedRating(currentRatings);
  const currentWhole = Math.floor(combined);
  const nextBracket = getNextVaBracket(currentWhole);

  if (combined >= nextBracket) return 0;

  const remainingHealthy = 100 - combined;
  const pointsNeeded = ((nextBracket - combined) * 100) / remainingHealthy;

  // Round up to nearest 5 (VA increments)
  return Math.ceil(pointsNeeded / 5) * 5;
}

// Calculate points needed to reach desired rating
function calculatePointsNeededForDesired(currentRatings, desired) {
  if (!desired || desired <= 0) return 0;
  const combined = calculateCombinedRating(currentRatings);
  if (combined >= desired) return 0;

  const remainingHealthy = 100 - combined;
  const pointsNeeded = ((desired - combined) * 100) / remainingHealthy;

  // Round up to nearest 5 (VA increments)
  return Math.ceil(pointsNeeded / 5) * 5;
}

  // Calculate points needed to reach desired rating
  function calculatePointsNeededForDesired(currentRatings, desired) {
    if (!desired || desired <= 0) return 0;
    const combined = calculateCombinedRating([...currentRatings]);
    if (combined >= desired) return 0;

    let pointsNeeded = 0;
    let testRatings = [...currentRatings];

    while (true) {
      pointsNeeded += 1;
      const remaining = 100 - calculateCombinedRating(testRatings);
      const increment = (1 * remaining) / 100;
      testRatings.push(1); // simulate adding a single point
      const newCombined = calculateCombinedRating(testRatings);

      if (Math.ceil(newCombined / 5) * 5 >= desired) break;
    }

    return pointsNeeded;
  }

  // Update current rating and outputs
  function updateCurrentRating() {
    const combined = calculateCombinedRating(selectedRatings);
    currentRatingDisplay.textContent = Math.floor(combined) + '%';

    // Points to next VA bracket
    const pointsToNext = calculatePointsToNextBracket(selectedRatings);
    nextBracketDisplay.textContent = pointsToNext;

    // Points to desired rating (if chosen)
    const desired = parseFloat(desiredRatingInput.value) || 0;
    if (desired > 0) {
      const pointsNeeded = calculatePointsNeededForDesired(selectedRatings, desired);
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
