document.addEventListener('DOMContentLoaded', () => {
  const symptomEntriesContainer = document.getElementById('symptomEntriesContainer');
  const addEntryButton = document.getElementById('addEntryButton');
  const analyzeButton = document.getElementById('analyzeButton');
  const dynamicSymptomsList = document.getElementById('dynamicSymptomsList');

  // Systems available from the first system-select on page
  const systems = Array.from(document.querySelectorAll('.system-select > option'))
    .slice(1) // skip placeholder
    .map(opt => opt.value);

  // Images map (ensure paths and keys are exact matches)
  const systemImages = {
    "Dental and Oral Conditions": "512px-202402_Oral_Cavity.svg.png",
    "Hemic and Lymphatic Systems": "512px-2201_Anatomy_of_the_Lymphatic_System.jpg",
    "Cardiovascular system": "512px-Circulatory_System_en_edited.svg.png",
    "Skin": "512px-Dermatology_-_Integumentary_system_1_--_Smart-Servier.png",
    "Digestive System": "512px-Digestive_system_diagram_en.svg.png",
    "Endocrine system": "512px-Endocrine_English.svg.png",
    "Gynecological conditions and disprders of the breast": "512px-Female_genital_system_-_Sagittal_view.svg.png",
    "Eye": "512px-Lateral_orbit_nerves_chngd.jpg",
    "Genitourinary system": "512px-Male_and_female_genital_organs.svg.png",
    "Musculoskeletal system": "512px-Skeleton_and_muscles.png",
    "Respiratory system": "512px-Respiratory_system_complete_fr_simplified.svg.png",
    "Nervous System": "512px-TE-Nervous_system_diagram.svg.png",
    "Ear": "Auditory_System.jpg",
    "Sense Organs": "Sense-Organ.png"
  };

  addEntryButton.addEventListener('click', addSymptomEntry);

  symptomEntriesContainer.addEventListener('click', e => {
    if (e.target.classList.contains('remove-entry-button')) {
      const entry = e.target.closest('.symptom-entry');
      if (symptomEntriesContainer.children.length > 1) {
        entry.remove();
        dynamicSymptomsList.innerHTML = '';
      } else {
        resetEntry(entry);
      }
      document.getElementById('results').innerHTML = '';
    }
  });

  // When system or sub-system changes
 let currentActiveEntry = null;  // add this near top of your script

symptomEntriesContainer.addEventListener('change', async (e) => {
  const entry = e.target.closest('.symptom-entry');

  if (e.target.classList.contains('system-select')) {
    const system = e.target.value;
    const img = entry.querySelector('.system-image');
    const subSystemSelect = entry.querySelector('.sub-system-select');

    // Clear sub-system select and symptoms list
    subSystemSelect.innerHTML = `<option value="">Select a sub-system</option>`;
    dynamicSymptomsList.innerHTML = '';

    // Show system image if available
    if (systemImages[system]) {
      img.src = `/images/${systemImages[system]}`;
      img.style.display = 'block';
    } else {
      img.src = '';
      img.style.display = 'none';
    }

    if (!system) {
      // No system selected — clear and exit
      return;
    }

    // Fetch sub-systems for selected system
    try {
      const res = await fetch(`/api/sub-systems/${encodeURIComponent(system)}`);
      if (!res.ok) throw new Error('Failed to fetch sub-systems');
      const subSystems = await res.json();

      // Populate sub-system select dropdown
      subSystems.forEach(sub => {
        const option = document.createElement('option');
        option.value = sub;
        option.textContent = sub;
        subSystemSelect.appendChild(option);
      });
    } catch (err) {
      console.error(err);
      alert('Error loading sub-systems');
    }
  }

  if (e.target.classList.contains('sub-system-select')) {
    const subSystem = e.target.value;
    dynamicSymptomsList.innerHTML = '';

    if (!subSystem) {
      return; // no sub-system selected, clear symptoms and exit
    }

    // Track current active entry globally
    currentActiveEntry = entry;

    try {
      const res = await fetch(`/api/symptoms/${encodeURIComponent(subSystem)}`);
      if (!res.ok) throw new Error('Failed to fetch symptoms');
      const symptoms = await res.json();

      // Populate symptoms checkboxes
      symptoms.forEach(symptom => {
        const label = document.createElement('label');
        label.style.display = 'block';
        label.innerHTML = `<input type="checkbox" value="${symptom}"> ${symptom}`;
        dynamicSymptomsList.appendChild(label);
      });
    } catch (err) {
      console.error(err);
      dynamicSymptomsList.innerHTML = '<p>Failed to load symptoms</p>';
    }
  }
});


 analyzeButton.addEventListener('click', async event => {
  event.preventDefault();

  const csrfToken = document.getElementById('csrfToken').value;

  if (!currentActiveEntry) {
    alert('Please select a sub-system and symptoms to analyze.');
    return;
  }

  const system = currentActiveEntry.querySelector('.system-select').value.trim();
  const subSystem = currentActiveEntry.querySelector('.sub-system-select').value.trim();

  if (!system || !subSystem) {
    alert('Please select system and sub-system.');
    return;
  }

  const checkedSymptoms = Array.from(dynamicSymptomsList.querySelectorAll('input[type=checkbox]:checked'))
    .map(cb => cb.value);

  if (checkedSymptoms.length === 0) {
    alert('Please select at least one symptom.');
    return;
  }

  const symptomsData = [{
    system,
    subSystem,
    symptoms: checkedSymptoms
  }];

  try {
    const res = await fetch('/api/analyze-symptoms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify(symptomsData),
      credentials: 'include',
    });

    if (!res.ok) throw new Error('Failed to analyze symptoms');

    const results = await res.json();
    displayResults(results);
  } catch (err) {
    console.error('Error analyzing symptoms:', err);
    document.getElementById('results').innerHTML = `<p>Error: ${err.message}</p>`;
  }
});


  
  function addSymptomEntry() {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'symptom-entry';

    // System select
    const labelSystem = document.createElement('label');
    labelSystem.textContent = 'System Affected: ';
    const selectSystem = document.createElement('select');
    selectSystem.className = 'system-select';
    selectSystem.required = true;

    const defaultOptionSys = document.createElement('option');
    defaultOptionSys.value = '';
    defaultOptionSys.textContent = 'Select a system';
    selectSystem.appendChild(defaultOptionSys);

    systems.forEach(sys => {
      const option = document.createElement('option');
      option.value = sys;
      option.textContent = sys;
      selectSystem.appendChild(option);
    });

    labelSystem.appendChild(selectSystem);

    // Sub-system select
    const labelSubSystem = document.createElement('label');
    labelSubSystem.textContent = ' Sub-System: ';
    const selectSubSystem = document.createElement('select');
    selectSubSystem.className = 'sub-system-select';
    selectSubSystem.required = true;
    selectSubSystem.innerHTML = `<option value="">Select a sub-system</option>`;
    labelSubSystem.appendChild(selectSubSystem);

    // Image
    const img = document.createElement('img');
    img.className = 'system-image';
    img.alt = 'System Image';
    img.style.display = 'none';
    img.style.cursor = 'pointer';

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-entry-button';
    removeBtn.textContent = 'Remove Entry';

    entryDiv.appendChild(labelSystem);
    entryDiv.appendChild(labelSubSystem);
    entryDiv.appendChild(img);
    entryDiv.appendChild(removeBtn);

    symptomEntriesContainer.appendChild(entryDiv);
  }

  function resetEntry(entry) {
    entry.querySelector('.system-select').value = '';
    entry.querySelector('.sub-system-select').innerHTML = `<option value="">Select a sub-system</option>`;
    const img = entry.querySelector('.system-image');
    img.src = '';
    img.style.display = 'none';

    dynamicSymptomsList.innerHTML = '';
  }

  function displayResults(results) {
  const resultsContainer = document.getElementById('results');
  resultsContainer.innerHTML = '';

  results.forEach(entry => {
    const systemHeader = document.createElement('h3');
    systemHeader.textContent = entry.system; // No subSystem, just system
    resultsContainer.appendChild(systemHeader);

    if (entry.possibleConditions.length === 0) {
      const noMatch = document.createElement('p');
      noMatch.textContent = 'No matching conditions found.';
      resultsContainer.appendChild(noMatch);
      return;
    }

    const ul = document.createElement('ul');
    entry.possibleConditions.forEach(cond => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${cond.condition_name}</strong> 
        (${cond.matchPercent || 0}% match)
        <br>Code: ${cond.medical_code || 'N/A'}
        <br>Presumptive: ${cond.presumptive_raw || 'N/A'}
        <br>Qualifying Circumstance: ${cond.qualifying_circumstance || 'N/A'}
        <br>Evidence Basis: ${cond.evidence_basis || 'N/A'}
      `;
      ul.appendChild(li);
    });

    resultsContainer.appendChild(ul);
  });
}

