document.addEventListener('DOMContentLoaded', () => {
  const ratingButtons = document.querySelectorAll('.rating-btn');
  const selectedRatingsContainer = document.getElementById('selected-ratings');
  const currentRatingDisplay = document.getElementById('currentRating');
  const desiredRatingInput = document.getElementById('desiredRating');
  const nextBracketDisplay = document.getElementById('nextBracketPoints');
  const pointsNeededDisplay = document.getElementById('pointsNeeded');
  const vaRoundedDisplay = document.getElementById('vaRoundedRating');

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
    // Calculate what individual rating this would round to
    const individualRounded = Math.round(current);
    
    // Calculate current VA bracket
    let currentBracket;
    if (individualRounded >= 90 && individualRounded <= 94) {
        currentBracket = 95;
    } else {
        currentBracket = Math.round(individualRounded / 10) * 10;
    }
    
    // If already at 100%, return 100
    if (currentBracket >= 100) return 100;
    
    // Always target the next bracket (simpler approach)
    const currentIndex = vaBrackets.indexOf(currentBracket);
    return vaBrackets[currentIndex + 1] || 100;
}
////////////////////////////////////////////////////////////////////////////
  // Calculate points needed using remaining healthy fraction
function calculatePointsToTarget(currentRatings, targetBracket) {
    // Calculate combined rating and preserve decimals
    let combined = calculateCombinedRating([...currentRatings]);

    // Calculate minimum rating needed for target bracket
    let minRatingForTarget;
    if (targetBracket === 100) {
        minRatingForTarget = 95; // Need ≥95% for 100% bracket
    } else if (targetBracket === 95) {
        minRatingForTarget = 90; // Need ≥90% for "95%" display
    } else {
        minRatingForTarget = targetBracket - 5; // Normal case: X bracket requires ≥(X-5)%
    }

    // If already at/above target threshold, calculate for NEXT bracket
    if (combined >= minRatingForTarget) {
        // Determine next bracket
        let nextBracket;
        if (targetBracket === 95) {
            nextBracket = 100; // After 95% comes 100%
        } else if (targetBracket === 100) {
            return 0; // Can't go higher than 100%
        } else {
            nextBracket = targetBracket + 10; // Normal progression
        }
        
        // Recursively calculate for next bracket
        return calculatePointsToTarget(currentRatings, nextBracket);
    }

    // Calculate points needed using remaining healthy percentage
    const remainingHealthy = 100 - combined;
    const rawPointsNeeded = ((minRatingForTarget - combined) * 100) / remainingHealthy;

    // Always round up to nearest 10 points
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
    console.log('Next bracket:', nextBracket);
    
    const pointsToNext = calculatePointsToTarget(selectedRatings, nextBracket);
    console.log('Points to next:', pointsToNext);
    
    nextBracketDisplay.textContent = pointsToNext;

    const desired = parseFloat(desiredRatingInput.value) || 0;
    if (desired > 0) {
        const pointsNeeded = calculatePointsToTarget(selectedRatings, desired);
        pointsNeededDisplay.textContent = pointsNeeded;
    } else {
        pointsNeededDisplay.textContent = '—';
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////
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
