document.addEventListener('DOMContentLoaded', () => {
  const ratingButtons = document.querySelectorAll('.rating-btn');
  const selectedRatingsContainer = document.getElementById('selected-ratings');
  const currentRatingDisplay = document.getElementById('currentRating');
  const nextBracketDisplay = document.getElementById('nextBracketPoints');
  const vaRoundedDisplay = document.getElementById('vaRoundedRating');

  let selectedRatings = [];

  // VA-style combined rating calculation (highest first)
  function calculateCombinedRating(ratings) {
    const sorted = [...ratings].sort((a, b) => b - a); 
    let remaining = 100;
    let combined = 0;
    sorted.forEach(r => {
      const add = (r * remaining) / 100;
      combined += add;
      remaining -= add;
    });
    return combined;
  }
  
  function vaRound(combined) {
    const whole = combined % 1 >= 0.5 ? Math.ceil(combined) : Math.floor(combined);
    const remainder = whole % 10;
    const base = whole - remainder;
    
    if (remainder >= 5) {
        return base + 10;
    } else {
        return base;
    }
  }
  
  const vaBrackets = [10,20,30,40,50,60,70,80,90,95,100];

  function getNextVaBracket(current) {
    const individualRounded = Math.round(current);
    
    let currentBracket;
    if (individualRounded >= 90 && individualRounded <= 94) {
        currentBracket = 95;
    } else {
        currentBracket = Math.round(individualRounded / 10) * 10;
    }
   
    if (currentBracket >= 100) return 100;

    const currentIndex = vaBrackets.indexOf(currentBracket);
    return vaBrackets[currentIndex + 1] || 100;
  }

  ////////////////////////////////////////////////////////////////////////////
  // Calculate points needed using remaining healthy fraction
  function calculatePointsToTarget(currentRatings, targetBracket) {
    let combined = calculateCombinedRating([...currentRatings]);

    let minRatingForTarget;
    if (targetBracket === 100) {
        minRatingForTarget = 95; // Need ≥95% for 100% bracket
    } else if (targetBracket === 95) {
        minRatingForTarget = 90; // Need ≥90% for "95%" display
    } else {
        minRatingForTarget = targetBracket - 5; // Normal case
    }

    if (combined >= minRatingForTarget) {
        let nextBracket;
        if (targetBracket === 95) {
            nextBracket = 100;
        } else if (targetBracket === 100) {
            return 0; 
        } else {
            nextBracket = targetBracket + 10;
        }
        return calculatePointsToTarget(currentRatings, nextBracket);
    }

    const remainingHealthy = 100 - combined;
    const rawPointsNeeded = ((minRatingForTarget - combined) * 100) / remainingHealthy;

    return Math.ceil(rawPointsNeeded / 10) * 10;
  }
  //////////////////////////////////////////////////////////////////////////

  function updateCurrentRating() {
    const combined = calculateCombinedRating(selectedRatings);
    
    const roundedCombined = Math.round(combined);
    currentRatingDisplay.textContent = roundedCombined + '%';

    const vaRoundedRating = vaRound(combined);
    vaRoundedDisplay.textContent = vaRoundedRating + '%'; 
  
    const nextBracket = getNextVaBracket(combined);
    const pointsToNext = calculatePointsToTarget(selectedRatings, nextBracket);

    // 🔹 Display the result on the page (instead of console.log)
    nextBracketDisplay.textContent = 
      pointsToNext > 0 
        ? `${pointsToNext} points to reach ${nextBracket}%` 
        : `Already at max bracket`;
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
});
