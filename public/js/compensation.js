document.addEventListener('DOMContentLoaded', () => {
  const ratingButtons = document.querySelectorAll('.rating-btn');
  const selectedRatingsContainer = document.getElementById('selected-ratings');
  const currentRatingDisplay = document.getElementById('currentRating');
  const desiredRatingInput = document.getElementById('desiredRating');
  const pointsNeededDisplay = document.getElementById('pointsNeeded');

  // Store selected ratings in an array
  let selectedRatings = [];

  // Function to calculate VA-style combined rating (unrounded, in selection order)
  function calculateCombinedRating(ratings) {
    if (!ratings || ratings.length === 0) return 0;

    let remaining = 100;
    let combined = 0;

    // Apply each rating sequentially, in the order chosen
    ratings.forEach(rating => {
      const add = (rating * remaining) / 100;
      combined += add;
      remaining -= add;
    });

    return combined;
  }

  function calculatePointsNeeded(currentRatings, desired) {
    if (!desired || desired <= 0) return 0;

    let combined = calculateCombinedRating(currentRatings);
    if (combined >= desired) return 0;

    let remainingEfficiency = 100;
    currentRatings.forEach(r => {
      remainingEfficiency -= (r / 100) * remainingEfficiency;
    });

    const desiredRemaining = 100 - desired;
    const extraNeeded = remainingEfficiency - desiredRemaining;

    return Math.ceil(extraNeeded);
  }

  // Function to update current rating and points needed
 document.addEventListener('DOMContentLoaded', () => {
  const ratingButtons = document.querySelectorAll('.rating-btn');
  const selectedRatingsContainer = document.getElementById('selected-ratings');
  const currentRatingDisplay = document.getElementById('currentRating');
  const desiredRatingInput = document.getElementById('desiredRating');
  const pointsNeededDisplay = document.getElementById('pointsNeeded');

  let selectedRatings = [];

  // VA-style combined rating
  function calculateCombinedRating(ratings) {
    if (!ratings || ratings.length === 0) return 0;
    let remaining = 100;
    let combined = 0;
    ratings.forEach(r => {
      const add = (r * remaining) / 100;
      combined += add;
      remaining -= add;
    });
    return combined;
  }

  // NEW: Calculate points needed to reach desired rating
  function calculatePointsNeeded(currentRatings, desired) {
    if (!desired || desired <= 0) return 0;

    let combined = calculateCombinedRating(currentRatings);
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
    const combinedWhole = Math.floor(combined);
    currentRatingDisplay.textContent = combinedWhole + '%';

    const desired = parseFloat(desiredRatingInput.value) || 0;
    const pointsNeeded = calculatePointsNeeded(selectedRatings, desired);
    pointsNeededDisplay.textContent = pointsNeeded;
  }

  // Button click logic
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

  desiredRatingInput.addEventListener('input', () => {
    updateCurrentRating();
  });
});


  // Handle rating button clicks
  ratingButtons.forEach(button => {
    button.addEventListener('click', () => {
      const rating = parseInt(button.dataset.rating);

      // Always add the rating (allow duplicates)
      selectedRatings.push(rating);

      // Create a removable button in selectedRatingsContainer
      const selectedBtn = document.createElement('button');
      selectedBtn.className = 'rating-btn selected';
      selectedBtn.textContent = rating + '%';
      selectedBtn.dataset.rating = rating;

      selectedBtn.addEventListener('click', () => {
        // Remove this specific rating instance
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
