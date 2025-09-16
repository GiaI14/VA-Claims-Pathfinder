document.addEventListener('DOMContentLoaded', function () {
    const ratingButtons = document.querySelectorAll('.rating-btn');
    const selectedRatingsContainer = document.getElementById('selected-ratings');
    const desiredRatingInput = document.getElementById('desiredRating'); // Add this input in your EJS
    const currentCombinedSpan = document.getElementById('currentCombined');
    const pointsNeededSpan = document.getElementById('pointsNeeded');

    // Add selected rating buttons
    ratingButtons.forEach(button => {
        button.addEventListener('click', () => {
            const rating = parseInt(button.dataset.rating);
            
            const selectedBtn = document.createElement('button');
            selectedBtn.className = 'rating-btn selected';
            selectedBtn.setAttribute('data-rating', rating);
            selectedBtn.textContent = rating + '%';

            // Remove rating if clicked again
            selectedBtn.addEventListener('click', () => {
                selectedBtn.remove();
                updateRatings();
            });

            selectedRatingsContainer.appendChild(selectedBtn);
            updateRatings();
        });
    });

    // Update combined rating and points needed
    function updateRatings() {
        const ratings = [...selectedRatingsContainer.querySelectorAll('.rating-btn')]
            .map(btn => parseInt(btn.dataset.rating))
            .filter(r => r > 0);

        const currentCombined = calculateCombinedRatingInOrder(ratings);
        currentCombinedSpan.textContent = currentCombined.toFixed(1) + '%';

        const desiredRating = parseFloat(desiredRatingInput.value) || 0;
        const pointsNeeded = Math.max(0, desiredRating - currentCombined);
        pointsNeededSpan.textContent = pointsNeeded.toFixed(1) + '%';
    }

    // Recalculate whenever desired rating input changes
    desiredRatingInput.addEventListener('input', updateRatings);

    // VA-style calculation respecting order
    function calculateCombinedRatingInOrder(ratings) {
        let remaining = 100;
        let combined = 0;
        ratings.forEach(rating => {
            const add = (rating * remaining) / 100;
            combined += add;
            remaining -= add;
        });
        return combined;
    }
});
