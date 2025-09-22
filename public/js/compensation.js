document.addEventListener('DOMContentLoaded', () => {
  const ratingButtons = document.querySelectorAll('.rating-btn');
  const selectedRatingsContainer = document.getElementById('selected-ratings');
  const currentRatingDisplay = document.getElementById('currentRating');
  const desiredRatingInput = document.getElementById('desiredRating');
  const nextBracketDisplay = document.getElementById('nextBracketPoints');
  const pointsNeededDisplay = document.getElementById('pointsNeeded');
  const vaRoundedDisplay = document.getElementById('vaRoundedRating');
  const desiredRatingInput = document.getElementById('desiredRatingInput');

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
// add this helper (use your existing variable names - desiredRatingInput is already defined)
function updateDesiredRatingOptions(currentVaRating) {
  if (!desiredRatingInput) return;

  // If it's not a SELECT, set min for number input and return
  if (desiredRatingInput.tagName !== 'SELECT') {
    // keep behavior for number input type (optional)
    // set min to next available bracket > currentVaRating
    const next = (function () {
      for (let i = 10; i <= 100; i += 10) if (i > currentVaRating) return i;
      return 100;
    })();
    desiredRatingInput.min = next;
    // if current value is invalid, clear it
    if (desiredRatingInput.value && Number(desiredRatingInput.value) <= currentVaRating) {
      desiredRatingInput.value = '';
    }
    return;
  }

  // It's a SELECT: rebuild options so only values > currentVaRating are available
  const prev = desiredRatingInput.value;            // preserve previous selection if valid
  // keep the placeholder option (if you had one)
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select rating';
  // clear and re-add
  desiredRatingInput.innerHTML = '';
  desiredRatingInput.appendChild(placeholder);

  for (let i = 10; i <= 100; i += 10) {
    if (i > currentVaRating) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = i + '%';
      desiredRatingInput.appendChild(opt);
    }
  }

  // restore previous value if it still exists and is > currentVaRating
  if (prev && Number(prev) > currentVaRating) {
    const exists = Array.from(desiredRatingInput.options).some(o => o.value === prev);
    if (exists) desiredRatingInput.value = prev;
  } else {
    // leave placeholder selected
    desiredRatingInput.value = '';
  }
}

// Replace your existing updateCurrentRating() with this (uses your exact var names)
function updateCurrentRating() {
    const combined = calculateCombinedRating(selectedRatings);

    // keep current roundedCombined behavior intact
    const roundedCombined = Math.round(combined);
    currentRatingDisplay.textContent = roundedCombined + '%';

    // determine VA rounded value using whichever function exists (vaRounding or vaRound)
    const vaRoundedRating = (typeof vaRounding === 'function')
      ? vaRounding(combined)
      : (typeof vaRound === 'function' ? vaRound(combined)
         // fallback: safe VA-style rounding inline
         : (function(c){
             const whole = c % 1 >= 0.5 ? Math.ceil(c) : Math.floor(c);
             const rem = whole % 10;
             return rem >= 5 ? (whole - rem + 10) : (whole - rem);
           })(combined));

    // display VA rounded
    vaRoundedDisplay.textContent = vaRoundedRating + '%';

    // update the desired-rating control to only expose options higher than current VA rounded
    updateDesiredRatingOptions(vaRoundedRating);

    // Next bracket & points to next (unchanged)
    const nextBracket = getNextVaBracket(combined);
    const pointsToNext = calculatePointsToTarget(selectedRatings, nextBracket);
    nextBracketDisplay.textContent = pointsToNext;

    // Points needed to reach chosen desired rating (only if valid and > VA rounded)
    const desired = parseFloat(desiredRatingInput.value) || 0;
    if (desired > 0) {
      if (desired <= vaRoundedRating) {
        pointsNeededDisplay.textContent = '—';
      } else {
        const pointsNeeded = calculatePointsToTarget(selectedRatings, desired);
        pointsNeededDisplay.textContent = pointsNeeded;
      }
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
