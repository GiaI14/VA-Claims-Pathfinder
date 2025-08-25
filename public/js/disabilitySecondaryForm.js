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

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.textContent = 'Remove';
  removeButton.className = 'remove-disability-button';
  removeButton.style.display = 'none'; 
  disabilityWrapper.appendChild(removeButton);

  newDisabilityInput.addEventListener('input', function () {
    if (newDisabilityInput.value.trim() !== '') {
      removeButton.style.display = 'inline-block';
    } else {
      removeButton.style.display = 'none'; 
    }
  });

  const minusButton = document.createElement('button');
  minusButton.type = 'button';
  minusButton.textContent = '-';
  minusButton.className = 'minus-disability-button';
  disabilityWrapper.appendChild(minusButton);

  disabilitiesDiv.appendChild(disabilityWrapper);
}

function handleDisabilityRemoval(event) {
  // Case 1: Hidden remove button
  if (event.target.classList.contains('remove-disability-button')) {
    const disabilityWrapper = event.target.closest('.disability-entry');
    const disabilityId = disabilityWrapper.getAttribute('data-id');
    console.log('Removing disability with ID via Remove button:', disabilityId);

    disabilityWrapper.remove();

    const disabilityInputs = document.querySelectorAll('#disabilities input');
    const disabilities = Array.from(disabilityInputs).map(input => input.value.trim()).filter(Boolean);

    if (disabilities.length === 0) {
      document.getElementById('secondaryConditions').innerHTML = '';
      console.log('No disabilities left. Secondary conditions area cleared.');
    } else {
      submitDisabilities();
    }
  }

  // Case 2: Minus button
  if (event.target.classList.contains('minus-disability-button')) {
    const disabilityWrapper = event.target.closest('.disability-wrapper');
    const disabilityId = disabilityWrapper.getAttribute('data-id');
    console.log('Removing disability with ID via Minus button:', disabilityId);

    disabilityWrapper.remove();
    // No auto re-fetch here unless you want:
    // submitDisabilities();
  }
}

async function submitDisabilities() {
  console.log('Submit Disabilities button clicked');

  const disabilityInputs = document.querySelectorAll('#disabilities input');
  const disabilities = Array.from(disabilityInputs).map(input => input.value.trim()).filter(Boolean);

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
    displaySecondaryConditions(data.secondaryConditions);
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred while fetching secondary conditions: ' + error.message);
  }
}

function displaySecondaryConditions(conditions) {
  const secondaryConditionsDiv = document.getElementById('secondaryConditions');
  secondaryConditionsDiv.innerHTML = '<h3>Conditions and Secondary Conditions</h3>';
  
  if (conditions.length > 0) {
    const ul = document.createElement('ul');
    conditions.forEach(condition => {
      const li = document.createElement('li');
      li.setAttribute('data-disability-id', condition.disabilityId);
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
});
