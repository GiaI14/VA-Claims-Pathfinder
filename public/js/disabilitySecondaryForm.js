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
  minusButton.type = 'button'
  minusButton.textContent ='x';
  minusButton.className = 'minus-disability-button';
  disabilityWrapper.appendChild(minusButton);

  disabilitiesDiv.appendChild(disabilityWrapper);
}

function handleDisabilityRemoval(event) {
  const disabilityWrapper = event.target.closest('.disability-entry');
  const isRemoveButton = event.target.classList.contains('remove-disability-button');

  if (event.target.classList.contains('minus-disability-button')) {
    if (!disabilityWrapper) return;
    console.log('Minus button clicked:', disabilityWrapper.dataset.id);
    disabilityWrapper.remove();
  }

  if (isRemoveButton) {
    console.log('Remove button clicked, clearing all.');
    document.getElementById('disabilities').innerHTML = '';
    document.getElementById('secondaryConditions').innerHTML = '';
    disabilityCounter = 0;

     const addBtn = document.getElementById('addDisabilityButton');
    if (addBtn) addBtn.style.display = 'inline-block';
  }
}


async function submitDisabilities() {
  console.log('Submit Disabilities button clicked');

  const disabilityInputs = document.querySelectorAll('#disabilities input');
  const disabilities = Array.from(disabilityInputs)
  .map(input => {
    const normalizedValue = input.value
      .trim()
      .toLowerCase()
      .split(/\s+/)[0]; // only first word

    return {
      disabilityId: input.closest('.disability-entry').dataset.id,
      value: normalizedValue
    };
  })
  .filter(d => d.value !== '');

console.log('Disabilities to submit (normalized):', disabilities);

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
      body: JSON.stringify({ disabilities: disabilities.map(d => d.value) }),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from server:', errorData);
      throw new Error(errorData.message || 'Failed to fetch secondary conditions');
    }

    const data = await response.json();
    console.log('Secondary conditions:', data.secondaryConditions);

    displaySecondaryConditions(data.secondaryConditions, disabilities);

    // Hide minus buttons after submission
    document.querySelectorAll('.minus-disability-button').forEach(btn => btn.remove());

    // Hide Add Disability button after results
    const addBtn = document.getElementById('addDisabilityButton');
    if (addBtn) addBtn.style.display = 'none';

    // Add single Remove button if it doesn't exist
    const disabilitiesDiv = document.getElementById('disabilities');
    if (!document.querySelector('.remove-disability-button')) {
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.textContent = 'Remove';
      removeButton.className = 'remove-disability-button';
      disabilitiesDiv.appendChild(removeButton);
    }

  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred while fetching secondary conditions: ' + error.message);
  }
}


function displaySecondaryConditions(conditions, disabilities) {
  const secondaryConditionsDiv = document.getElementById('secondaryConditions');
  secondaryConditionsDiv.innerHTML = '<h3>Conditions and Secondary Conditions</h3>';

  if (conditions.length > 0) {
    disabilities.forEach(disability => {
      const related = conditions.filter(c =>
        c.condition_name.toLowerCase().includes(disability.value.toLowerCase())
      );

      const div = document.createElement('div');
     
      if (related.length > 0) {
        const ul = document.createElement('ul');
        related.forEach(condition => {
          const li = document.createElement('li');
          li.innerHTML = `<strong>${condition.condition_name}</strong><br>
                          Secondary Conditions: ${condition.secondary_conditions || 'None'}`;
          ul.appendChild(li);
        });
        div.appendChild(ul);
      } else {
        div.innerHTML += '<p>No matching conditions found.</p>';
      }

      secondaryConditionsDiv.appendChild(div);
    });
  } else {
    secondaryConditionsDiv.innerHTML += '<p>No matching conditions found.</p>';
  }
  
const saveButton = document.createElement('button');
  saveButton.textContent = 'Save Results';
  saveButton.id = 'saveResultsBtn';
  saveButton.style.display = 'inline-block';
  saveButton.style.padding = '10px 20px';
  saveButton.style.backgroundColor = '#1a73e8';
  saveButton.style.color = 'white';
  saveButton.style.border = 'none';
  saveButton.style.borderRadius = '6px';
  saveButton.style.fontSize = '16px';
  saveButton.style.cursor = 'pointer';
  saveButton.style.marginTop = '15px';

  // Append after everything else
  secondaryConditionsDiv.appendChild(saveButton);

  saveButton.addEventListener('click', () => {
  const savedSecondaryConditions = [];
  const listItems = secondaryConditionsDiv.querySelectorAll('li');
  listItems.forEach(item => savedSecondaryConditions.push(item.innerText));

  // Get CSRF token at the time of click
  const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

  fetch('/save-results', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({results: savedSecondaryConditions }),
    credentials: 'same-origin'
  })
  .then(response => response.json())
  .then(data => alert('Secondary conditions saved successfully!'))
  .catch(error => {
    console.error(error);
    alert('Error saving secondary conditions.');
  });
});
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
      disabilityCounter = 0;
      console.log('All disabilities cleared, results reset.');
    });
  }
});
