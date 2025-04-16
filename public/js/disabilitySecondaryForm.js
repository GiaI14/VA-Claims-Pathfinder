let disabilityCounter = 0; // Counter to generate unique IDs

function addDisability() {
  const disabilitiesDiv = document.getElementById('disabilities');
  const disabilityWrapper = document.createElement('div');
  disabilityWrapper.className = 'disability-wrapper';
  const disabilityId = `disability-${disabilityCounter++}`; // Generate a unique ID
  disabilityWrapper.setAttribute('data-id', disabilityId); // Assign the unique ID

  const newDisabilityInput = document.createElement('input');
  newDisabilityInput.type = 'text';
  newDisabilityInput.placeholder = 'Enter disability';
  disabilityWrapper.appendChild(newDisabilityInput);

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.textContent = 'Remove';
  removeButton.className = 'remove-disability-button';
  removeButton.style.display = 'none'; // Initially hide the button
  disabilityWrapper.appendChild(removeButton);

  // Show the "Remove" button when the input has a value
  newDisabilityInput.addEventListener('input', function () {
    if (newDisabilityInput.value.trim() !== '') {
      removeButton.style.display = 'inline-block'; // Show the button
    } else {
      removeButton.style.display = 'none'; // Hide the button
    }
  });

  disabilitiesDiv.appendChild(disabilityWrapper);
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
            li.setAttribute('data-disability-id', condition.disabilityId); // Associate with disability ID
            li.innerHTML = `<strong>${condition.condition_name}</strong><br>
                            Secondary Conditions: ${condition.secondary_conditions || 'None'}`;
            ul.appendChild(li);
        });
        secondaryConditionsDiv.appendChild(ul);
    } else {
        secondaryConditionsDiv.innerHTML += '<p>No matching conditions found.</p>';
    }
}

function handleDisabilityRemoval(event) {
  if (event.target.classList.contains('remove-disability-button')) {
    const disabilityWrapper = event.target.closest('.disability-wrapper');
    const disabilityId = disabilityWrapper.getAttribute('data-id');

    console.log('Removing disability with ID:', disabilityId);

    // Remove the disability wrapper
    disabilityWrapper.remove();

    // Check if there are any disabilities left
    const disabilityInputs = document.querySelectorAll('#disabilities input');
    const disabilities = Array.from(disabilityInputs).map(input => input.value.trim()).filter(Boolean);

    if (disabilities.length === 0) {
      // Clear secondary conditions if no disabilities remain
      const secondaryConditionsDiv = document.getElementById('secondaryConditions');
      secondaryConditionsDiv.innerHTML = ''; // Clear the content completely
      console.log('No disabilities left. Secondary conditions area cleared.');
    } else {
      // Trigger a re-fetch of secondary conditions
      submitDisabilities();
    }
  }
}

function displaySecondaryConditions(conditions) {
  const secondaryConditionsDiv = document.getElementById('secondaryConditions');
  secondaryConditionsDiv.innerHTML = '<h3>Conditions and Secondary Conditions</h3>';
  
  if (conditions.length > 0) {
    const ul = document.createElement('ul');
    conditions.forEach(condition => {
      const li = document.createElement('li');
      li.setAttribute('data-disability-id', condition.disabilityId); // Associate with disability ID
      li.innerHTML = `<strong>${condition.condition_name}</strong><br>
                      Secondary Conditions: ${condition.secondary_conditions || 'None'}`;
      ul.appendChild(li);
    });
    secondaryConditionsDiv.appendChild(ul);
  } else {
    secondaryConditionsDiv.innerHTML += '<p>No matching conditions found.</p>';
  }
}
