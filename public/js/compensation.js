document.addEventListener('DOMContentLoaded', () => {
  const ratingButtons = document.querySelectorAll('.rating-btn');
  const selectedRatingsContainer = document.getElementById('selected-ratings');
  const currentRatingDisplay = document.getElementById('currentRating');
  const desiredRatingInput = document.getElementById('desiredRating');
  const nextBracketDisplay = document.getElementById('nextBracketPoints');
  const pointsNeededDisplay = document.getElementById('pointsNeeded');

  let selectedRatings = [];

  // VA-style combined rating (highest first)
  function calculateCombinedRating(ratings) {
    const sorted = [...ratings].sort((a,b)=>b-a);
    let remaining = 100;
    let combined = 0;
    sorted.forEach(r => {
      const add = (r * remaining) / 100;
      combined += add;
      remaining -= add;
    });
    return combined;
  }

  const vaBrackets = [10,20,30,40,50,60,70,80,90,95,100];

  function getNextVaBracket(current) {
    for (let b of vaBrackets) if (current < b) return b;
    return 100;
  }

  // Calculate points needed using remaining healthy fraction
  function calculatePointsToTarget(currentCombined, target) {
    if (currentCombined >= target) return 0;

    const remainingHealthy = 100 - currentCombined;
    let pointsNeeded = ((target - currentCombined) * 100) / remainingHealthy;

    // Round to VA increments (10 points), except 95→100
    if (target === 100 && currentCombined >= 90) {
      pointsNeeded = Math.ceil(pointsNeeded / 50) * 50; // 90→100 = 50 points
    } else if (target === 95) {
      pointsNeeded = Math.ceil(pointsNeeded / 5) * 5; // 90→95 = 5 points
    } else {
      pointsNeeded = Math.ceil(pointsNeeded / 10) * 10;
    }

    return pointsNeeded;
  }

  function updateCurrentRating() {
    const combined = calculateCombinedRating(selectedRatings);
    currentRatingDisplay.textContent = Math.floor(combined) + '%';

    // Next VA bracket
    const nextBracket = getNextVaBracket(combined);
    const pointsToNext = calculatePointsToTarget(combined, nextBracket);
    nextBracketDisplay.textContent = pointsToNext;

    // Desired rating
    const desired = parseFloat(desiredRatingInput.value) || 0;
    if (desired > 0) {
      const pointsNeeded = calculatePointsToTarget(combined, desired);
      pointsNeededDisplay.textContent = pointsNeeded;
    } else {
      pointsNeededDisplay.textContent = '—';
    }
  }

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

  desiredRatingInput.addEventListener('input', () => updateCurrentRating());
});
