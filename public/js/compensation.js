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

function getNextVaBracket(currentCombined) {
  const currentBracket = vaRound(currentCombined);
  const idx = vaBrackets.indexOf(currentBracket);
  return vaBrackets[idx + 1] || 100;
}

function calculatePointsToTarget(currentRatings, targetBracket) {
  const combined = calculateCombinedRating([...currentRatings]);

  // Already at-or-above the target bracket
  const currentVa = vaRound(combined);
  if (currentVa >= targetBracket) return 0;

  for (let add = 0; add <= 100; add += 10) {
    const newCombined = combined + (add * (100 - combined) / 100);
    const newVa = vaRound(newCombined);
    if (newVa >= targetBracket) {
      return add;
    }
  }

  return 100;
}

  //////////////////////////////////////////////////////////////////////////
function updateCurrentRating() {
    if (selectedRatings.length === 0) {
        currentRatingDisplay.textContent = "0%";
        vaRoundedDisplay.textContent = "0%";
        nextBracketDisplay.textContent = "0%";
        document.getElementById('currentComp').textContent = "$0.00";
        document.getElementById('nextBracketComp').textContent = "$0.00";
        document.getElementById('payDifference').textContent = "$0.00";
        return; // Stop here, no fetch
    }

    const combined = calculateCombinedRating(selectedRatings);
    const roundedCombined = Math.round(combined);
    currentRatingDisplay.textContent = roundedCombined + '%';

    const vaRoundedRating = vaRound(combined);
    vaRoundedDisplay.textContent = vaRoundedRating + '%'; 

    // Determine next VA bracket
    let nextBracket;
    if (vaRoundedRating >= 100) {
        nextBracketDisplay.textContent = "Already at maximum 100%";
        nextBracket = 100;
    } else {
        nextBracket = getNextVaBracket(combined); 

        let displayBracket = nextBracket;
        if (nextBracket === 95 && vaRoundedRating >= 90) {
            displayBracket = 100;
        }

        const pointsToNext = calculatePointsToTarget(selectedRatings, nextBracket);
        nextBracketDisplay.textContent = pointsToNext > 0 
            ? `${pointsToNext} points to reach ${displayBracket}%` 
            : `Already at max bracket`;
    }

    // Send to backend
    fetch('/compensation/calculate', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
            currentRating: [vaRoundedRating], // send VA rounded
            nextBracketRating: nextBracket,   // send next bracket
            spouse: spouse.checked,
            childrenUnder18: parseInt(childrenUnder18.value),
            childrenOver18: parseInt(childrenOver18.value),
            numParents: parseInt(numParents.value)
        })
    })
    .then(res => res.json())
    .then(data => {
        // Parse safely
        let currentComp = parseFloat(data.totalCompensation) || 0;
        let nextComp = parseFloat(data.nextBracketCompensation) || 0;

        // Special case: if rating is 0%
        if (vaRoundedRating === 0) {
            currentComp = 0;
        }

        const difference = (nextComp - currentComp);

        // Update DOM
        document.getElementById('currentComp').textContent = `$${currentComp.toFixed(2)}`;
        document.getElementById('nextBracketComp').textContent = `$${nextComp.toFixed(2)}`;
        document.getElementById('payDifference').textContent = `$${difference.toFixed(2)}/month`;
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
  el.addEventListener('input', updateCurrentRating);  // typing (mobile)
  el.addEventListener('change', updateCurrentRating); // fallback
});
});
});
