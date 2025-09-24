document.addEventListener('DOMContentLoaded', () => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
  
  const ratingButtons = document.querySelectorAll('.rating-btn');
  const selectedRatingsContainer = document.getElementById('selected-ratings');
  const currentRatingDisplay = document.getElementById('currentRating');
  const nextBracketDisplay = document.getElementById('nextBracketPoints');
  const vaRoundedDisplay = document.getElementById('vaRoundedRating');
  const toggleBtn = document.getElementById('toggle-dependents');
  const dependentsContainer = document.getElementById('dependents-container');

  const spouse = document.getElementById("spouse");
  const childrenUnder18 = document.getElementById("childrenUnder18");
  const childrenOver18 = document.getElementById("childrenOver18");
  const numParents = document.getElementById("numParents");
  
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

    // 🔹 Next VA bracket
    if (vaRoundedRating === 100) {
        nextBracketDisplay.textContent = "Already at maximum 100%";
    } else {
        const nextBracket = getNextVaBracket(combined);
        const pointsToNext = calculatePointsToTarget(selectedRatings, nextBracket);

        nextBracketDisplay.textContent = pointsToNext > 0 
            ? `${pointsToNext} points to reach ${nextBracket}%` 
            : `Already at max bracket`;
    }

  fetch('/compensation/calculate', {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({
        currentRating: selectedRatings,
        spouse: spouse.checked,
        childrenUnder18: parseInt(childrenUnder18.value),
        childrenOver18: parseInt(childrenOver18.value),
        numParents: parseInt(numParents.value)
    })
})
    .then(res => res.json())
    .then(data => {
        // Match server response keys
        document.getElementById('currentComp').textContent = data.totalCompensation || '0.00';
        document.getElementById('nextBracketComp').textContent = data.nextBracketCompensation || '0.00';

        // Optional: calculate difference if both exist
        if (data.totalCompensation && data.nextBracketCompensation) {
            const difference = parseFloat(data.nextBracketCompensation) - parseFloat(data.totalCompensation);
            document.getElementById('payDifference').textContent = difference.toFixed(2);
        } else {
            document.getElementById('payDifference').textContent = '0.00';
        }
    })
    .catch(err => console.error('Error fetching compensation:', err));
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////               
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

toggleBtn.addEventListener('click', () => {
    const isVisible = dependentsContainer.style.display === 'block';
    dependentsContainer.style.display = isVisible ? 'none' : 'block';
    toggleBtn.textContent = isVisible ? 'Add Dependents' : 'Hide Dependents';
  });

  [spouse, childrenUnder18, childrenOver18, numParents].forEach(el => {
    el.addEventListener('change', () => {
        updateCurrentRating();
    });
});
});
