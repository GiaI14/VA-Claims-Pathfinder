document.addEventListener('DOMContentLoaded', () => {
  const ratingButtons = document.querySelectorAll('.rating-btn');
  const selectedRatingsContainer = document.getElementById('selected-ratings');
  const currentRatingDisplay = document.getElementById('currentRating');
  const desiredRatingInput = document.getElementById('desiredRating');
  const pointsNeededDisplay = document.getElementById('pointsNeeded');

  // Store selected ratings in an array
  let selectedRatings = [];

  // Function to calculate VA-style combined rating (unrounded)
  function calculateCombinedRating(ratings) {
    if (!ratings || ratings.length === 0) return 0;

    // Sort descending
    const sortedRatings = [...ratings].sort((a, b) => b - a);

    let remaining = 100;
    let combined = 0;

    sortedRatings.forEach(rating => {
      const add = (rating * remaining) / 100;
      combined += add;
      remaining -= add;
    });

    return combined;
  }

  // Function to update current rating and points needed
  function updateCurrentRating() {
    const combined = calculateCombinedRating(selectedRatings);
    currentRatingDisplay.textContent = combined.toFixed(1) + '%';

    const desired = parseFloat(desiredRatingInput.value) || 0;
    const pointsNeeded = Math.max(0, desired - combined);
    pointsNeededDisplay.textContent = pointsNeeded.toFixed(1);
  }

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
