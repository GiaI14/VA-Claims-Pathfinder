document.addEventListener('DOMContentLoaded', () => {
  const ratingButtons = document.querySelectorAll('.rating-btn');
  const selectedRatingsContainer = document.getElementById('selected-ratings');
  const currentRatingDisplay = document.getElementById('currentRating');
  const desiredRatingInput = document.getElementById('desiredRating');
  const pointsNeededDisplay = document.getElementById('pointsNeeded');

  // Store selected ratings in an array
  let selectedRatings = [];

  // Function to calculate VA combined rating (unrounded)
  function calculateCombinedRating(ratings) {
    if (ratings.length === 0) return 0;

    // Sort descending
    ratings.sort((a, b) => b - a);

    let remaining = 100;
    let combined = 0;

    ratings.forEach(rating => {
      let add = (rating * remaining) / 100;
      combined += add;
      remaining -= add;
    });

    return combined;
  }

  // Function to update current rating display
  function updateCurrentRating() {
    const combined = calculateCombinedRating(selectedRatings);
    currentRatingDisplay.textContent = combined.toFixed(1) + '%';

    // Update points needed automatically if desired rating is set
    const desired = parseFloat(desiredRatingInput.value) || 0;
    const pointsNeeded = Math.max(0, desired - combined);
    pointsNeededDisplay.textContent = pointsNeeded.toFixed(1);
  }

  // Handle rating button clicks
  ratingButtons.forEach(button => {
    button.addEventListener('click', () => {
      const rating = parseInt(button.dataset.rating);

      // Add button to selected list if not already
      if (!selectedRatings.includes(rating)) {
        selectedRatings.push(rating);

        // Create a removable button in selectedRatingsContainer
        const selectedBtn = document.createElement('button');
        selectedBtn.className = 'rating-btn selected';
        selectedBtn.textContent = rating + '%';
        selectedBtn.dataset.rating = rating;

        selectedBtn.addEventListener('click', () => {
          // Remove from array
          selectedRatings = selectedRatings.filter(r => r !== rating);
          selectedBtn.remove();
          updateCurrentRating();
        });

        selectedRatingsContainer.appendChild(selectedBtn);
      }

      updateCurrentRating();
    });
  });

  // Update points needed when desired rating changes
  desiredRatingInput.addEventListener('input', () => {
    updateCurrentRating();
  });

});
