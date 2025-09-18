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

  // VA brackets
  const vaBrackets = [10,20,30,40,50,60,70,80,90,95,100];

  // Get next VA bracket based on current rating
  function getNextVaBracket(current) {
    for (let b of vaBrackets) {
      if (current < b) return b;
    }
    return 100;
  }
////////////////////////////////////////////////////////////////////////////
  // Calculate points needed using remaining healthy fraction
function calculatePointsToTarget(currentRatings, targetBracket) {
  const combined = calculateCombinedRating([...currentRatings]); // raw combined %

  // quick clamp
  if (combined >= 100) return { points: 0, rawPercentNeeded: 0, effectiveRawTarget: 100, effectiveRoundTarget: 100 };

  // Treat requested targets >=95 as a request for the "100" rounded bracket
  const requestedRoundTarget = targetBracket >= 95 ? 100 : targetBracket;

  // Current VA-displayed rounded rating (multiples of 10)
  const currentRounded = Math.round(combined / 10) * 10;

  // If display already meets/exceeds requested target, aim for the next rounded bracket
  let effectiveRoundTarget = requestedRoundTarget;
  if (currentRounded >= requestedRoundTarget) {
    effectiveRoundTarget = Math.min(requestedRoundTarget + 10, 100);
  }

  // The RAW % that will round to effectiveRoundTarget:
  // - to be rounded to N (10,20,...,90) you must reach N-5 (e.g. 70 <- 65)
  // - to be rounded to 100 you must reach 95
  const effectiveRawTarget = (effectiveRoundTarget === 100) ? 95 : (effectiveRoundTarget - 5);

  // How many raw % points are needed
  const rawPercentNeeded = Math.max(0, effectiveRawTarget - combined);
  if (rawPercentNeeded === 0) return { points: 0, rawPercentNeeded: 0, effectiveRawTarget, effectiveRoundTarget };

  // Your original "points" formula (keeps current behavior):
  const remainingHealthy = 100 - combined;
  const rawPointsNeeded = (rawPercentNeeded * 100) / remainingHealthy;
  const points = Math.ceil(rawPointsNeeded / 10) * 10; // returned in multiples of 10

  // ---- OPTIONAL ALTERNATE POINTS MAPPING ----
  // If you prefer "1 raw % => 10 points" (so 94 -> 95 becomes exactly 10 points),
  // uncomment the next line and return `pointsByPercent` instead of `points`.
  //
  // const pointsByPercent = Math.ceil(rawPercentNeeded) * 10;

  return {
    points,                    // current-formula points (multiples of 10)
    //pointsByPercent: pointsByPercent, // optional alternate mapping
    rawPercentNeeded,          // e.g. 1 for 94 -> 95
    effectiveRawTarget,        // raw threshold being aimed for (e.g. 95)
    effectiveRoundTarget       // rounded bracket (e.g. 100)
  };
}


//////////////////////////////////////////////////////////////////////////
  // Update current rating and outputs
  function updateCurrentRating() {
    const combined = calculateCombinedRating(selectedRatings);
    currentRatingDisplay.textContent = Math.floor(combined) + '%';

    // Points to next VA bracket
    const nextBracket = getNextVaBracket(combined);
    const pointsToNext = calculatePointsToTarget(selectedRatings, nextBracket);
    nextBracketDisplay.textContent = pointsToNext;

    // Points to desired rating (if entered)
    const desired = parseFloat(desiredRatingInput.value) || 0;
    if (desired > 0) {
      const pointsNeeded = calculatePointsToTarget(selectedRatings, desired);
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
