let disabilityCounter = 0; // Counter to generate unique IDs

function addDisability() {
  const disabilitiesDiv = document.getElementById('disabilities');
  const disabilityWrapper = document.createElement('div');
  disabilityWrapper.className = 'disability-entry';
  const disabilityId = `disability-${disabilityCounter++}`; 
  disabilityWrapper.setAttribute('data-id', disabilityId);

  const newDisabilityInput = document.createElement('input');
  newDisabilityInput.type = 'text';
  newDisabilityInput.placeholder = 'Enter disability';
  newDisabilityInput.className = 'disability-name';
  disabilityWrapper.appendChild(newDisabilityInput);

  const minusButton = document.createElement('button');
  minusButton.type = 'button';
  minusButton.textContent = '-';
  minusButton.className = 'minus-disability-button';
  disabilityWrapper.appendChild(minusButton);

  disabilitiesDiv.appendChild(disabilityWrapper);
}

function handleDisabilityRemoval(event) {
  const disabilityWrapper = event.target.closest('.disability-entry');
  if (!disabilityWrapper) return;

  const disabilityId = disabilityWrapper.dataset.id;

  // Minus button: remove input + its results (only works before submit)
  if (event.target.classList.contains('minus-disability-button')) {
    console.log('Minus button clicked:', disabilityId);

    // Remove the input entry
    disabilityWrapper.remove();

    // Remove linked results if they exist
    const results = document.querySelectorAll(`#secondaryConditions [data-disability-id="${disabilityId}"]`);
    results.forEach(r => r.remove());
  }

  // Remove button: resets everything after submission
  if (event.target.classList.contains('remove-disability-button')) {
    console.log('Remove button clicked. Resetting all.');
    document.getElementById('disabilities').innerHTML = '';
    document.getElementById('secondaryConditions').innerHTML = '';
    document.getElementById('addDisabilityButton').style.display = 'inline-block'; // Show add button again
  }
}

async function submitDisabilities() {
  console.log('Submit Disabilities button clicked');

  const disabilityInputs = document.querySelectorAll('#disabilities input');
  const disabilities = Array.from(disabilityInputs)
    .map(input => input.value.trim())
    .filter(Boolean);

  console.log('Disabilities to submit:', disabilities);

  if (disabilities.length === 0) {
    alert('Please add at least one disability.');
    return;
  }

  try {
    console.log('Sending request to /api/secondary-conditions...');
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const response = await fetch('/api/secondary-conditions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({ disabilities }),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from server:', errorData);
      throw new Error(errorData.message || 'Failed to fetch secondary conditions');
    }

    const data = await response.json();
    console.log('Secondary conditions:', data.secondaryConditions);

    displaySecondaryConditions(data.secondaryConditions, disabilityInputs);
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred while fetching secondary conditions: ' + error.message);
  }
}

function displaySecondaryConditions(conditions, inputs) {
  const secondaryConditionsDiv = document.getElementById('secondaryConditions');
  secondaryConditionsDiv.innerHTML = '<h3>Conditions and Secondary Conditions</h3>';

  // Hide add button and all minus buttons after submission
  const addBtn = document.getElementById('addDisabilityButton');
  if (addBtn) addBtn.style.display = 'none';

  const minusButtons = document.querySelectorAll('.minus-disability-button');
  minusButtons.forEach(btn => btn.style.display = 'none');

  // Show Remove button at top if not already
  let removeBtn = document.querySelector('.remove-disability-button');
  if (!removeBtn) {
    removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.className = 'remove-disability-button';
    document.getElementById('disabilities').prepend(removeBtn);
  }

  if (conditions.length > 0) {
    const ul = document.createElement('ul');

    conditions.forEach((condition, index) => {
      const li = document.createElement('li');

      // Attach result to its input ID
      const inputWrapper = inputs[index].closest('.disability-entry');
      const disabilityId = inputWrapper.dataset.id;

      li.setAttribute('data-disability-id', disabilityId);
      li.innerHTML = `<strong>${condition.condition_name}</strong><br>
                      Secondary Conditions: ${condition.secondary_conditions || 'None'}`;
      ul.appendChild(li);
    });

    secondaryConditionsDiv.appendChild(ul);
  } else {
    secondaryConditionsDiv.innerHTML += '<p>No matching conditions found.</p>';
  }
}

// Attach listeners once
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('addDisabilityButton')
          .addEventListener('click', addDisability);

  document.getElementById('submitDisabilitiesButton')
          .addEventListener('click', submitDisabilities);

  document.getElementById('disabilities')
          .addEventListener('click', handleDisabilityRemoval);

  const clearAllBtn = document.getElementById('clearAllDisabilitiesButton');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      document.getElementById('disabilities').innerHTML = '';
      document.getElementById('secondaryConditions').innerHTML = '';
      document.getElementById('addDisabilityButton').style.display = 'inline-block';
      console.log('All disabilities cleared, results reset.');
    });
  }
});
